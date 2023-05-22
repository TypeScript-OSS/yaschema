import _ from 'lodash';

import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../../types/schema';
import { noError } from '../consts';
import type { InternalValidator } from '../types/internal-validation';
import { getValidationMode } from './get-validation-mode';
import { isErrorResult } from './is-error-result';
import { makeErrorResultForValidationMode } from './make-error-result-for-validation-mode';

const numberRegex = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;

export const supportVariableSerializationFormsForNumericValues =
  <ValueT extends number>(
    getSchema: () => Schema<ValueT> & { allowedSerializationForms?: Array<'number' | 'string'> },
    normalizedValidator: InternalValidator
  ): InternalValidator =>
  (value, validatorOptions, path) => {
    const schema = getSchema();
    if (
      validatorOptions.transformation === 'none' ||
      schema.allowedSerializationForms === undefined ||
      schema.allowedSerializationForms.length === 0 ||
      (schema.allowedSerializationForms.length === 1 && schema.allowedSerializationForms[0] === 'number')
    ) {
      return normalizedValidator(value, validatorOptions, path);
    }

    switch (validatorOptions.transformation) {
      case 'serialize': {
        const validation = normalizedValidator(value, validatorOptions, path);
        if (isErrorResult(validation)) {
          return validation;
        }

        for (const form of schema.allowedSerializationForms ?? []) {
          switch (form) {
            case 'number':
              return validation;
            case 'string': {
              value = String(value);

              validatorOptions.modifyWorkingValueAtPath(path, value);

              if (isErrorResult(validation)) {
                return validation;
              }
            }
          }
        }
        break;
      }
      case 'deserialize': {
        for (const form of schema.allowedSerializationForms ?? []) {
          switch (form) {
            case 'number': {
              if (typeof value === 'number') {
                return normalizedValidator(value, validatorOptions, path);
              }
              break;
            }
            case 'string': {
              if (typeof value === 'string' && numberRegex.test(value)) {
                const numericValue = Number(value);
                validatorOptions.modifyWorkingValueAtPath(path, numericValue);
                value = numericValue;

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
    }

    return noError;
  };
