import { getLogger } from '../../config/logging';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { JsonValue } from '../../types/json-value';
import type { Schema } from '../../types/schema';
import type { SerDes } from '../../types/ser-des';
import type { ValidationMode } from '../../types/validation-options';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalState } from '../internal/internal-schema-maker-impl/internal-state';
import type { GenericContainer } from '../internal/types/generic-container';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalTransformationType, InternalValidationResult, InternalValidator } from '../internal/types/internal-validation';
import type { LazyPath } from '../internal/types/lazy-path';
import { cloner } from '../internal/utils/cloner';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { makeClonedValueNoError, makeNoError } from '../internal/utils/make-no-error';

export type CustomValidationResult = { error?: string } | { error?: undefined };

export type CustomValidation<ValueT> = (value: ValueT) => CustomValidationResult;

export interface CustomSchemaOptions<ValueT, SerializedT extends JsonValue> {
  serDes: SerDes<ValueT, SerializedT>;
  typeName: string;
  isContainerType?: boolean;

  /** Performs validation logic.  By default, only `isValueType` is checked, using the `serDes` field. */
  customValidation?: CustomValidation<ValueT>;
}

/** Used for adding custom schemas for complex types. */
export interface CustomSchema<ValueT, SerializedT extends JsonValue> extends Schema<ValueT> {
  schemaType: 'custom';
  clone: () => CustomSchema<ValueT, SerializedT>;

  serDes: SerDes<ValueT, SerializedT>;
  typeName: string;
}

/**
 * Use for adding custom schemas for complex types.
 *
 * For example, you might want to support a conceptual "big number", which can be serialized into a string or JSON object somehow and then
 * deserialized back into a "big number" value with all of the functions that you'd expect.
 */
export const custom = <ValueT, SerializedT extends JsonValue>(
  args: CustomSchemaOptions<ValueT, SerializedT>
): CustomSchema<ValueT, SerializedT> => new CustomSchemaImpl(args);

// Helpers

class CustomSchemaImpl<ValueT, SerializedT extends JsonValue>
  extends InternalSchemaMakerImpl<ValueT>
  implements CustomSchema<ValueT, SerializedT>
{
  // Public Fields

  public readonly serDes: SerDes<ValueT, SerializedT>;

  public readonly typeName: string;

  // PureSchema Field Overrides

  public override readonly schemaType = 'custom';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override readonly usesCustomSerDes = true;

  public override readonly isContainerType: boolean;

  // Private Fields

  private readonly customValidation_: CustomValidation<ValueT> | undefined;

  // Initialization

  constructor({ serDes, typeName, customValidation, isContainerType = false }: CustomSchemaOptions<ValueT, SerializedT>) {
    super();

    this.serDes = serDes;
    this.typeName = typeName;
    this.customValidation_ = customValidation;
    this.isContainerType = isContainerType;
  }

  // Public Methods

  public readonly clone = (): CustomSchema<ValueT, SerializedT> =>
    copyMetaFields({
      from: this,
      to: new CustomSchemaImpl<ValueT, SerializedT>({
        serDes: this.serDes,
        typeName: this.typeName,
        customValidation: this.customValidation_,
        isContainerType: this.isContainerType
      })
    });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) =>
    this.internalValidatorsByTransformationType_[internalState.transformation](value, internalState, path, container, validationMode);

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    typeName: this.typeName
  });

  // Private Methods

  private readonly internalValidateNoTransform_: InternalValidator = (value, internalState, path, container, validationMode) => {
    if (!this.serDes.isValueType(value)) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected ${this.typeName}, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return this.validateDeserializedForm_(value, internalState, path, container, validationMode);
  };

  private readonly internalValidateSerialize_: InternalValidator = (value, internalState, path, container, validationMode) => {
    if (!this.serDes.isValueType(value)) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected ${this.typeName}, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    const validation = this.validateDeserializedForm_(value, internalState, path, container, validationMode);

    const serialization = this.serialize_(value as ValueT, internalState, path, container, validationMode);
    if (isErrorResult(serialization)) {
      return serialization;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
    return isErrorResult(validation) ? { ...validation, invalidValue: () => serialization.value } : makeNoError(serialization.value);
  };

  private readonly internalValidateDeserialize_: InternalValidator = (value, internalState, path, container, validationMode) => {
    const serializedValidation = this.validateSerializedForm_(value, internalState, path, container, validationMode);
    if (isErrorResult(serializedValidation)) {
      return serializedValidation;
    }

    const deserialization = this.deserialize_(value as SerializedT, internalState, path, container, validationMode);
    if (isErrorResult(deserialization)) {
      return deserialization;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    value = deserialization.value;

    if (!this.serDes.isValueType(value)) {
      return makeErrorResultForValidationMode(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        () => value,
        validationMode,
        () => `Expected ${this.typeName}, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return this.validateDeserializedForm_(value, internalState, path, container, validationMode);
  };

  private readonly internalValidatorsByTransformationType_: Record<InternalTransformationType, InternalValidator> = {
    deserialize: this.internalValidateDeserialize_,
    none: this.internalValidateNoTransform_,
    serialize: this.internalValidateSerialize_
  };

  private readonly serialize_ = (
    value: ValueT,
    _validatorOptions: InternalState,
    path: LazyPath,
    _container: GenericContainer,
    validationMode: ValidationMode
  ): InternalValidationResult => {
    try {
      const serialization = this.serDes.serialize(value);

      const serializedValue = serialization.serialized;

      if (serialization.error !== undefined) {
        return {
          invalidValue: () => serializedValue,
          error: () => serialization.error,
          errorLevel: serialization.errorLevel,
          errorPath: path
        };
      } else {
        return makeClonedValueNoError(serializedValue);
      }
    } catch (e) {
      getLogger().error?.(`Failed to serialize ${this.typeName}`, path, e);

      return makeErrorResultForValidationMode(cloner(value), validationMode, () => `Failed to serialize ${this.typeName}`, path);
    }
  };

  private readonly deserialize_ = (
    value: SerializedT,
    _validatorOptions: InternalState,
    path: LazyPath,
    _container: GenericContainer,
    validationMode: ValidationMode
  ): InternalValidationResult => {
    try {
      const deserialization = this.serDes.deserialize(value);

      const deserializedValue = deserialization.deserialized;

      if (deserialization.error !== undefined) {
        return {
          invalidValue: () => deserializedValue,
          error: () => deserialization.error,
          errorLevel: deserialization.errorLevel,
          errorPath: path
        };
      } else {
        return makeClonedValueNoError(deserializedValue);
      }
    } catch (e) {
      getLogger().error?.(`Failed to deserialize ${this.typeName}`, path, e);

      return makeErrorResultForValidationMode(cloner(value), validationMode, () => `Failed to deserialize ${this.typeName}`, path);
    }
  };

  private readonly validateDeserializedForm_: InternalValidator = (
    value: any,
    _validatorOptions: InternalState,
    path: LazyPath,
    _container: GenericContainer,
    validationMode: ValidationMode
  ) => {
    if (validationMode === 'none') {
      return makeClonedValueNoError(value);
    }

    const additionalValidation = this.customValidation_?.(value as ValueT);
    const additionalValidationError = additionalValidation?.error;
    if (additionalValidationError !== undefined) {
      return makeErrorResultForValidationMode(cloner(value), validationMode, () => `${additionalValidationError}`, path);
    }

    return makeClonedValueNoError(value);
  };

  private readonly validateSerializedForm_: InternalValidator = (
    value: any,
    internalState: InternalState,
    path: LazyPath,
    container: GenericContainer,
    validationMode: ValidationMode
  ) => {
    const validation = (this.serDes.serializedSchema() as any as InternalSchemaFunctions).internalValidate(
      value,
      internalState,
      path,
      container,
      validationMode
    );
    if (isErrorResult(validation)) {
      return validation;
    }

    return makeClonedValueNoError(value);
  };
}
