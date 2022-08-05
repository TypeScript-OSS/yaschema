import _ from 'lodash';

import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../../types/schema';
import { noError } from '../consts';
import type { InternalValidator } from '../types/internal-validation';
import { atPath } from './path-utils';

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
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          const validation = normalizedValidator(value, validatorOptions, path);
          if (validation.error !== undefined) {
            return validation;
          }

          for (const form of schema.allowedSerializationForms ?? []) {
            switch (form) {
              case 'number':
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

                if (validation.error !== undefined) {
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
              case 'number': {
                if (typeof value === 'number') {
                  return normalizedValidator(value, validatorOptions, path);
                }
                break;
              }
              case 'string': {
                if (typeof value === 'string' && numberRegex.test(value)) {
                  const numericValue = Number(value);
                  validatorOptions.inoutModifiedPaths[path] = numericValue;
                  value = numericValue;

                  return normalizedValidator(value, validatorOptions, path);
                }
                break;
              }
            }
          }

          return {
            error: () =>
              `Expected ${(schema.allowedSerializationForms ?? []).join(' or ')}, found ${getMeaningfulTypeof(value)}${atPath(path)}`
          };
        }
        break;
      }
    }

    return noError;
  };
