import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import type { Schema } from '../../../types/schema';
import type { InternalValidator } from '../types/internal-validation';
import { cloner } from './cloner.js';
import { isErrorResult } from './is-error-result.js';
import { makeErrorResultForValidationMode } from './make-error-result-for-validation-mode.js';
import { makeNoError } from './make-no-error.js';

const booleanRegex = /^true|false$/;

export const supportVariableSerializationFormsForBooleanValues =
  <ValueT extends boolean>(
    getSchema: () => Schema<ValueT> & { allowedSerializationForms?: Array<'boolean' | 'string'> },
    normalizedValidator: InternalValidator
  ): InternalValidator =>
  (value, internalState, path, container, validationMode) => {
    const schema = getSchema();
    if (
      internalState.transformation === 'none' ||
      schema.allowedSerializationForms === undefined ||
      schema.allowedSerializationForms.length === 0 ||
      (schema.allowedSerializationForms.length === 1 && schema.allowedSerializationForms[0] === 'boolean')
    ) {
      return normalizedValidator(value, internalState, path, container, validationMode);
    }

    switch (internalState.transformation) {
      case 'serialize': {
        const validation = normalizedValidator(value, internalState, path, container, validationMode);
        if (isErrorResult(validation)) {
          return validation;
        }

        for (const form of schema.allowedSerializationForms ?? []) {
          switch (form) {
            case 'boolean':
              return validation;
            case 'string': {
              return { ...validation, value: String(value) };
            }
          }
        }
        break;
      }
      case 'deserialize': {
        for (const form of schema.allowedSerializationForms ?? []) {
          switch (form) {
            case 'boolean': {
              if (typeof value === 'boolean') {
                return normalizedValidator(value, internalState, path, container, validationMode);
              }
              break;
            }
            case 'string': {
              if (typeof value === 'string' && booleanRegex.test(value)) {
                return normalizedValidator(value === 'true', internalState, path, container, validationMode);
              }
              break;
            }
          }
        }

        return makeErrorResultForValidationMode(
          cloner(value),
          validationMode,
          () => `Expected ${(schema.allowedSerializationForms ?? []).join(' or ')}, found ${getMeaningfulTypeof(value)}`,
          path
        );
      }
    }

    return makeNoError(value);
  };
