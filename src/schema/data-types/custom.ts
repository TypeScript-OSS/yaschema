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
import type { LazyPath } from '../internal/types/lazy-path';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { resolveLazyPath } from '../internal/utils/path-utils';

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
    path: LazyPath
  ): InternalValidationResult & { serialized?: JsonValue } => {
    try {
      const serialization = serDes.serialize(value);

      const serializedValue = serialization.serialized;

      validatorOptions.modifyWorkingValueAtPath(path, serializedValue);

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
    path: LazyPath
  ): InternalValidationResult & { deserialized?: ValueT } => {
    try {
      const deserialization = serDes.deserialize(value);

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
      getLogger().error?.(`Failed to deserialize ${typeName}`, path, e);

      const validationMode = getValidationMode(validatorOptions);

      return makeErrorResultForValidationMode(validationMode, () => `Failed to deserialize ${typeName}`, path);
    }
  };

  const validateDeserializedForm: InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: LazyPath) => {
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

  const validateSerializedForm: InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: LazyPath) => {
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
        const resolvedPath = resolveLazyPath(path);
        if (!(resolvedPath in validatorOptions.inoutModifiedPaths)) {
          if (!serDes.isValueType(value)) {
            return makeErrorResultForValidationMode(
              validationMode,
              () => `Expected ${typeName}, found ${getMeaningfulTypeof(value)}`,
              resolvedPath
            );
          }

          const validation = validateDeserializedForm(value, validatorOptions, resolvedPath);

          const serialization = serialize(value as ValueT, validatorOptions, resolvedPath);
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
        const resolvedPath = resolveLazyPath(path);
        if (!(resolvedPath in validatorOptions.inoutModifiedPaths)) {
          const serializedValidation = validateSerializedForm(value, validatorOptions, resolvedPath);
          if (isErrorResult(serializedValidation)) {
            return serializedValidation;
          }

          const deserialization = deserialize(value as SerializedT, validatorOptions, resolvedPath);
          if (isErrorResult(deserialization)) {
            return deserialization;
          }
          value = deserialization.deserialized;

          if (!serDes.isValueType(value)) {
            return makeErrorResultForValidationMode(
              validationMode,
              () => `Expected ${typeName}, found ${getMeaningfulTypeof(value)}`,
              resolvedPath
            );
          }

          const deserializedValidation = validateDeserializedForm(value, validatorOptions, resolvedPath);
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
