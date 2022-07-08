import _ from 'lodash';

import { getLogger } from '../../config/logging';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { JsonValue } from '../../types/json-value';
import type { Schema } from '../../types/schema';
import type { SerDes } from '../../types/ser-des';
import type { ValidationResult } from '../../types/validator';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { CommonSchemaOptions } from '../internal/types/common-schema-options';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalValidationOptions, InternalValidator } from '../internal/types/internal-validation';
import { atPath } from '../internal/utils/path-utils';

export type CustomValidation<ValueT> = (value: ValueT) => ValidationResult;

export interface CustomSchemaOptions<ValueT> extends CommonSchemaOptions {
  serDes: SerDes<ValueT>;
  typeName: string;

  /** Performs validation logic.  By default, only `isValueType` is checked, using the `serDes` field. */
  customValidation?: CustomValidation<ValueT>;
}

/** Used for adding custom schemas for complex types. */
export interface CustomSchema<ValueT> extends Schema<ValueT>, CustomSchemaOptions<ValueT> {
  schemaType: 'custom';
}

/**
 * Use for adding custom schemas for complex types.
 *
 * For example, you might want to support a conceptual "big number", which can be serialized into a string or JSON object somehow and then
 * deserialized back into a "big number" value with all of the functions that you'd expect.
 */
export const custom = <ValueT>({ serDes, typeName, customValidation, ...options }: CustomSchemaOptions<ValueT>): CustomSchema<ValueT> => {
  const serialize = (value: ValueT, validatorOptions: InternalValidationOptions, path: string) => {
    try {
      const serialization = serDes.serialize(value);

      const serializationError = serialization.error !== undefined ? () => `${serialization.error}${atPath(path)}` : undefined;
      const serializedValue = serialization.serialized;

      if (path === '') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        validatorOptions.workingValue = serializedValue;
      } else {
        _.set(validatorOptions.workingValue, path, serializedValue);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      validatorOptions.inoutModifiedPaths[path] = serializedValue;

      return { error: serializationError, serialized: serializedValue };
    } catch (e) {
      getLogger().error?.(`Failed to serialize ${typeName}${atPath(path)}`, e);
      return { error: () => `Failed to serialize ${typeName}${atPath(path)}` };
    }
  };

  const deserialize = (value: any, validatorOptions: InternalValidationOptions, path: string) => {
    try {
      const deserialization = serDes.deserialize(value as JsonValue);

      const deserializedError = deserialization.error !== undefined ? () => `${deserialization.error}${atPath(path)}` : undefined;
      const deserializedValue = deserialization.deserialized;

      validatorOptions.inoutModifiedPaths[path] = deserializedValue;

      return { error: deserializedError, deserialized: deserializedValue };
    } catch (e) {
      getLogger().error?.(`Failed to deserialize ${typeName}${atPath(path)}`, e);
      return { error: () => `Failed to deserialize ${typeName}${atPath(path)}` };
    }
  };

  const validateDeserializedForm: InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: string) => {
    if (validatorOptions.validation === 'none') {
      return noError;
    }

    const additionalValidation = customValidation?.(value as ValueT);
    const additionalValidationError = additionalValidation?.error;
    if (additionalValidationError !== undefined) {
      return { error: () => `${additionalValidationError}${atPath(path)}` };
    }

    return noError;
  };

  const validateSerializedForm: InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: string) => {
    if (validatorOptions.validation === 'none') {
      return noError;
    }

    const validation = (serDes.serializedSchema() as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (validation.error !== undefined) {
      return validation;
    }

    return noError;
  };

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    switch (validatorOptions.transformation) {
      case 'none':
        if (!serDes.isValueType(value)) {
          return { error: () => `Expected ${typeName}, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
        }

        return validateDeserializedForm(value, validatorOptions, path);
      case 'serialize': {
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          if (!serDes.isValueType(value)) {
            return { error: () => `Expected ${typeName}, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
          }

          const validation = validateDeserializedForm(value, validatorOptions, path);

          const serialization = serialize(value as ValueT, validatorOptions, path);
          if (serialization.error !== undefined) {
            return serialization;
          }
          value = serialization.serialized;

          if (validation.error !== undefined) {
            return validation;
          }
        }
        break;
      }
      case 'deserialize': {
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          const serializedValidation = validateSerializedForm(value, validatorOptions, path);
          if (serializedValidation.error !== undefined) {
            return serializedValidation;
          }

          const deserialization = deserialize(value, validatorOptions, path);
          if (deserialization.error !== undefined) {
            return deserialization;
          }
          value = deserialization.deserialized;

          if (!serDes.isValueType(value)) {
            return { error: () => `Expected ${typeName}, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
          }

          const deserializedValidation = validateDeserializedForm(value, validatorOptions, path);
          if (deserializedValidation.error !== undefined) {
            return deserializedValidation;
          }
        }
        break;
      }
    }

    return noError;
  };

  return makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'custom',
      serDes,
      typeName,
      ...options,
      estimatedValidationTimeComplexity: 1,
      usesCustomSerDes: true
    },
    { internalValidate }
  );
};
