import _ from 'lodash';

import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../../types/schema';
import { noError } from '../consts';
import type { InternalValidator } from '../types/internal-validation';
import { getValidationMode } from './get-validation-mode';
import { isErrorResult } from './is-error-result';
import { makeErrorResultForValidationMode } from './make-error-result-for-validation-mode';

const booleanRegex = /^true|false$/;

export const supportVariableSerializationFormsForBooleanValues =
  <ValueT extends boolean>(
    getSchema: () => Schema<ValueT> & { allowedSerializationForms?: Array<'boolean' | 'string'> },
    normalizedValidator: InternalValidator
  ): InternalValidator =>
  (value, validatorOptions, path) => {
    const schema = getSchema();
    if (
      validatorOptions.transformation === 'none' ||
      schema.allowedSerializationForms === undefined ||
      schema.allowedSerializationForms.length === 0 ||
      (schema.allowedSerializationForms.length === 1 && schema.allowedSerializationForms[0] === 'boolean')
    ) {
      return normalizedValidator(value, validatorOptions, path);
    }

    switch (validatorOptions.transformation) {
      case 'serialize': {
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          const validation = normalizedValidator(value, validatorOptions, path);
          if (isErrorResult(validation)) {
            return validation;
          }

          for (const form of schema.allowedSerializationForms ?? []) {
            switch (form) {
              case 'boolean':
                return validation;
              case 'string': {
                value = String(value);

                if (path === '') {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  validatorOptions.workingValue = value;
                } else {
                  _.set(validatorOptions.workingValue, path, value);
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                validatorOptions.inoutModifiedPaths[path] = value;

                if (isErrorResult(validation)) {
                  return validation;
                }
              }
            }
          }
        }
        break;
      }
      case 'deserialize': {
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          for (const form of schema.allowedSerializationForms ?? []) {
            switch (form) {
              case 'boolean': {
                if (typeof value === 'boolean') {
                  return normalizedValidator(value, validatorOptions, path);
                }
                break;
              }
              case 'string': {
                if (typeof value === 'string' && booleanRegex.test(value)) {
                  const booleanValue = value === 'true';
                  validatorOptions.inoutModifiedPaths[path] = booleanValue;
                  value = booleanValue;

                  return normalizedValidator(value, validatorOptions, path);
                }
                break;
              }
            }
          }

          const validationMode = getValidationMode(validatorOptions);

          return makeErrorResultForValidationMode(
            validationMode,
            () => `Expected ${(schema.allowedSerializationForms ?? []).join(' or ')}, found ${getMeaningfulTypeof(value)}`,
            path
          );
        }
        break;
      }
    }

    return noError;
  };
