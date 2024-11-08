import { withResolved } from '../../../internal/utils/withResolved.js';
import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import type { Schema } from '../../../types/schema';
import type { InternalAsyncValidator } from '../types/internal-validation.js';
import { cloner } from './cloner.js';
import { isErrorResult } from './is-error-result.js';
import { makeErrorResultForValidationMode } from './make-error-result-for-validation-mode.js';
import { makeNoError } from './make-no-error.js';

const numberRegex = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;

export const supportVariableSerializationFormsForNumericValues =
  <ValueT extends number>(
    getSchema: () => Schema<ValueT> & { allowedSerializationForms?: Array<'number' | 'string'> },
    normalizedValidator: InternalAsyncValidator
  ): InternalAsyncValidator =>
  (value, internalState, path, container, validationMode) => {
    const schema = getSchema();
    if (
      internalState.transformation === 'none' ||
      schema.allowedSerializationForms === undefined ||
      schema.allowedSerializationForms.length === 0 ||
      (schema.allowedSerializationForms.length === 1 && schema.allowedSerializationForms[0] === 'number')
    ) {
      return normalizedValidator(value, internalState, path, container, validationMode);
    }

    switch (internalState.transformation) {
      case 'serialize': {
        const validation = normalizedValidator(value, internalState, path, container, validationMode);
        return withResolved(validation, (validation) => {
          if (isErrorResult(validation)) {
            return validation;
          }

          for (const form of schema.allowedSerializationForms ?? []) {
            switch (form) {
              case 'number':
                return validation;
              case 'string': {
                return { ...validation, value: String(value) };
              }
            }
          }

          return makeNoError(value);
        });
      }
      case 'deserialize': {
        for (const form of schema.allowedSerializationForms ?? []) {
          switch (form) {
            case 'number': {
              if (typeof value === 'number') {
                return normalizedValidator(value, internalState, path, container, validationMode);
              }
              break;
            }
            case 'string': {
              if (typeof value === 'string' && numberRegex.test(value)) {
                return normalizedValidator(Number(value), internalState, path, container, validationMode);
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
  };
