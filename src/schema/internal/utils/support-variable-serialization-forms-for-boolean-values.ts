import _ from 'lodash';

import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../../types/schema';
import { noError } from '../consts';
import type { InternalValidator } from '../types/internal-validation';
import { getValidationMode } from './get-validation-mode';
import { isErrorResult } from './is-error-result';
import { makeErrorResultForValidationMode } from './make-error-result-for-validation-mode';
import { resolveLazyPath } from './path-utils';

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
        const resolvedPath = resolveLazyPath(path);
        if (!validatorOptions.inoutModifiedPaths.has(resolvedPath)) {
          const validation = normalizedValidator(value, validatorOptions, resolvedPath);
          if (isErrorResult(validation)) {
            return validation;
          }

          for (const form of schema.allowedSerializationForms ?? []) {
            switch (form) {
              case 'boolean':
                return validation;
              case 'string': {
                value = String(value);

                validatorOptions.modifyWorkingValueAtPath(resolvedPath, value);

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
        const resolvedPath = resolveLazyPath(path);
        if (!(resolvedPath in validatorOptions.inoutModifiedPaths)) {
          for (const form of schema.allowedSerializationForms ?? []) {
            switch (form) {
              case 'boolean': {
                if (typeof value === 'boolean') {
                  return normalizedValidator(value, validatorOptions, resolvedPath);
                }
                break;
              }
              case 'string': {
                if (typeof value === 'string' && booleanRegex.test(value)) {
                  const booleanValue = value === 'true';
                  validatorOptions.modifyWorkingValueAtPath(resolvedPath, booleanValue);
                  value = booleanValue;

                  return normalizedValidator(value, validatorOptions, resolvedPath);
                }
                break;
              }
            }
          }

          const validationMode = getValidationMode(validatorOptions);

          return makeErrorResultForValidationMode(
            validationMode,
            () => `Expected ${(schema.allowedSerializationForms ?? []).join(' or ')}, found ${getMeaningfulTypeof(value)}`,
            resolvedPath
          );
        }
        break;
      }
    }

    return noError;
  };
