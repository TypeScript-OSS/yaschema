import { getLogger } from '../../config/logging';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { JsonValue } from '../../types/json-value';
import type { Schema } from '../../types/schema';
import type { SerDes } from '../../types/ser-des';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalValidationOptions, InternalValidationResult, InternalValidator } from '../internal/types/internal-validation';
import type { LazyPath } from '../internal/types/lazy-path';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';

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

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);

    switch (validatorOptions.transformation) {
      case 'none':
        if (!this.serDes.isValueType(value)) {
          return makeErrorResultForValidationMode(
            validationMode,
            () => `Expected ${this.typeName}, found ${getMeaningfulTypeof(value)}`,
            path
          );
        }

        return this.validateDeserializedForm_(value, validatorOptions, path);
      case 'serialize': {
        if (!this.serDes.isValueType(value)) {
          return makeErrorResultForValidationMode(
            validationMode,
            () => `Expected ${this.typeName}, found ${getMeaningfulTypeof(value)}`,
            path
          );
        }

        const validation = this.validateDeserializedForm_(value, validatorOptions, path);

        const serialization = this.serialize_(value as ValueT, validatorOptions, path);
        if (isErrorResult(serialization)) {
          return serialization;
        }
        value = serialization.serialized;

        if (isErrorResult(validation)) {
          return validation;
        }
        break;
      }
      case 'deserialize': {
        const serializedValidation = this.validateSerializedForm_(value, validatorOptions, path);
        if (isErrorResult(serializedValidation)) {
          return serializedValidation;
        }

        const deserialization = this.deserialize_(value as SerializedT, validatorOptions, path);
        if (isErrorResult(deserialization)) {
          return deserialization;
        }
        value = deserialization.deserialized;

        if (!this.serDes.isValueType(value)) {
          return makeErrorResultForValidationMode(
            validationMode,
            () => `Expected ${this.typeName}, found ${getMeaningfulTypeof(value)}`,
            path
          );
        }

        const deserializedValidation = this.validateDeserializedForm_(value, validatorOptions, path);
        if (isErrorResult(deserializedValidation)) {
          return deserializedValidation;
        }
        break;
      }
    }

    return noError;
  };

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    typeName: this.typeName
  });

  // Private Methods

  private readonly serialize_ = (
    value: ValueT,
    validatorOptions: InternalValidationOptions,
    path: LazyPath
  ): InternalValidationResult & { serialized?: JsonValue } => {
    try {
      const serialization = this.serDes.serialize(value);

      const serializedValue = serialization.serialized;

      validatorOptions.modifyWorkingValueAtPath(path, serializedValue);

      if (serialization.error !== undefined) {
        return { error: () => serialization.error, errorLevel: serialization.errorLevel, errorPath: path, serialized: serializedValue };
      } else {
        return { serialized: serializedValue };
      }
    } catch (e) {
      getLogger().error?.(`Failed to serialize ${this.typeName}`, path, e);

      const validationMode = getValidationMode(validatorOptions);

      return makeErrorResultForValidationMode(validationMode, () => `Failed to serialize ${this.typeName}`, path);
    }
  };

  private readonly deserialize_ = (
    value: SerializedT,
    validatorOptions: InternalValidationOptions,
    path: LazyPath
  ): InternalValidationResult & { deserialized?: ValueT } => {
    try {
      const deserialization = this.serDes.deserialize(value);

      const deserializedValue = deserialization.deserialized;

      validatorOptions.modifyWorkingValueAtPath(path, deserializedValue);

      if (deserialization.error !== undefined) {
        return {
          error: () => deserialization.error,
          errorLevel: deserialization.errorLevel,
          errorPath: path,
          deserialized: deserializedValue
        };
      } else {
        return { deserialized: deserializedValue };
      }
    } catch (e) {
      getLogger().error?.(`Failed to deserialize ${this.typeName}`, path, e);

      const validationMode = getValidationMode(validatorOptions);

      return makeErrorResultForValidationMode(validationMode, () => `Failed to deserialize ${this.typeName}`, path);
    }
  };

  private readonly validateDeserializedForm_: InternalValidator = (
    value: any,
    validatorOptions: InternalValidationOptions,
    path: LazyPath
  ) => {
    const validationMode = getValidationMode(validatorOptions);
    if (validationMode === 'none') {
      return noError;
    }

    const additionalValidation = this.customValidation_?.(value as ValueT);
    const additionalValidationError = additionalValidation?.error;
    if (additionalValidationError !== undefined) {
      return makeErrorResultForValidationMode(validationMode, () => `${additionalValidationError}`, path);
    }

    return noError;
  };

  private readonly validateSerializedForm_: InternalValidator = (
    value: any,
    validatorOptions: InternalValidationOptions,
    path: LazyPath
  ) => {
    const validation = (this.serDes.serializedSchema() as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (isErrorResult(validation)) {
      return validation;
    }

    return noError;
  };
}
