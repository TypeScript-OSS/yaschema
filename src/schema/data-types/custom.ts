import _ from 'lodash';

import { getLogger } from '../../config/logging';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { JsonValue } from '../../types/json-value';
import type { Schema } from '../../types/schema';
import type { SerDes } from '../../types/ser-des';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalValidationOptions, InternalValidationResult, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';

export type CustomValidationResult = { error?: string } | { error?: undefined };

export type CustomValidation<ValueT> = (value: ValueT) => CustomValidationResult;

export interface CustomSchemaOptions<ValueT, SerializedT extends JsonValue> {
  serDes: SerDes<ValueT, SerializedT>;
  typeName: string;

  /** Performs validation logic.  By default, only `isValueType` is checked, using the `serDes` field. */
  customValidation?: CustomValidation<ValueT>;
  /** If `true`, `"shallow"` ancestor validation mode preferences won't be used when this schemas validation mode preference is
   * `"inherit"`, like other built-in container types */
  isContainerType?: boolean;
}

/** Used for adding custom schemas for complex types. */
export interface CustomSchema<ValueT, SerializedT extends JsonValue> extends Schema<ValueT>, CustomSchemaOptions<ValueT, SerializedT> {
  schemaType: 'custom';
  clone: () => CustomSchema<ValueT, SerializedT>;
}

/**
 * Use for adding custom schemas for complex types.
 *
 * For example, you might want to support a conceptual "big number", which can be serialized into a string or JSON object somehow and then
 * deserialized back into a "big number" value with all of the functions that you'd expect.
 */
export const custom = <ValueT, SerializedT extends JsonValue>({
  serDes,
  typeName,
  customValidation,
  isContainerType = false
}: CustomSchemaOptions<ValueT, SerializedT>): CustomSchema<ValueT, SerializedT> => {
  const serialize = (
    value: ValueT,
    validatorOptions: InternalValidationOptions,
    path: string
  ): InternalValidationResult & { serialized?: JsonValue } => {
    try {
      const serialization = serDes.serialize(value);

      const serializedValue = serialization.serialized;

      if (path === '') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        validatorOptions.workingValue = serializedValue;
      } else {
        _.set(validatorOptions.workingValue, path, serializedValue);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      validatorOptions.inoutModifiedPaths[path] = serializedValue;

      if (serialization.error !== undefined) {
        return { error: () => serialization.error, errorLevel: serialization.errorLevel, errorPath: path, serialized: serializedValue };
      } else {
        return { serialized: serializedValue };
      }
    } catch (e) {
      getLogger().error?.(`Failed to serialize ${typeName}`, path, e);

      const validationMode = getValidationMode(validatorOptions);

      return makeErrorResultForValidationMode(validationMode, () => `Failed to serialize ${typeName}`, path);
    }
  };

  const deserialize = (
    value: SerializedT,
    validatorOptions: InternalValidationOptions,
    path: string
  ): InternalValidationResult & { deserialized?: ValueT } => {
    try {
      const deserialization = serDes.deserialize(value);

      const deserializedValue = deserialization.deserialized;

      validatorOptions.inoutModifiedPaths[path] = deserializedValue;

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
      getLogger().error?.(`Failed to deserialize ${typeName}`, path, e);

      const validationMode = getValidationMode(validatorOptions);

      return makeErrorResultForValidationMode(validationMode, () => `Failed to deserialize ${typeName}`, path);
    }
  };

  const validateDeserializedForm: InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: string) => {
    const validationMode = getValidationMode(validatorOptions);
    if (validationMode === 'none') {
      return noError;
    }

    const additionalValidation = customValidation?.(value as ValueT);
    const additionalValidationError = additionalValidation?.error;
    if (additionalValidationError !== undefined) {
      return makeErrorResultForValidationMode(validationMode, () => `${additionalValidationError}`, path);
    }

    return noError;
  };

  const validateSerializedForm: InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: string) => {
    const validation = (serDes.serializedSchema() as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (isErrorResult(validation)) {
      return validation;
    }

    return noError;
  };

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);

    switch (validatorOptions.transformation) {
      case 'none':
        if (!serDes.isValueType(value)) {
          return makeErrorResultForValidationMode(validationMode, () => `Expected ${typeName}, found ${getMeaningfulTypeof(value)}`, path);
        }

        return validateDeserializedForm(value, validatorOptions, path);
      case 'serialize': {
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          if (!serDes.isValueType(value)) {
            return makeErrorResultForValidationMode(
              validationMode,
              () => `Expected ${typeName}, found ${getMeaningfulTypeof(value)}`,
              path
            );
          }

          const validation = validateDeserializedForm(value, validatorOptions, path);

          const serialization = serialize(value as ValueT, validatorOptions, path);
          if (isErrorResult(serialization)) {
            return serialization;
          }
          value = serialization.serialized;

          if (isErrorResult(validation)) {
            return validation;
          }
        }
        break;
      }
      case 'deserialize': {
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          const serializedValidation = validateSerializedForm(value, validatorOptions, path);
          if (isErrorResult(serializedValidation)) {
            return serializedValidation;
          }

          const deserialization = deserialize(value as SerializedT, validatorOptions, path);
          if (isErrorResult(deserialization)) {
            return deserialization;
          }
          value = deserialization.deserialized;

          if (!serDes.isValueType(value)) {
            return makeErrorResultForValidationMode(
              validationMode,
              () => `Expected ${typeName}, found ${getMeaningfulTypeof(value)}`,
              path
            );
          }

          const deserializedValidation = validateDeserializedForm(value, validatorOptions, path);
          if (isErrorResult(deserializedValidation)) {
            return deserializedValidation;
          }
        }
        break;
      }
    }

    return noError;
  };

  const fullSchema: CustomSchema<ValueT, SerializedT> = makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'custom',
      customValidation,
      isContainerType,
      clone: () => copyMetaFields({ from: fullSchema, to: custom(fullSchema) }),
      serDes,
      typeName,
      estimatedValidationTimeComplexity: 1,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: false,
      usesCustomSerDes: true
    },
    { internalValidate }
  );

  return fullSchema;
};
