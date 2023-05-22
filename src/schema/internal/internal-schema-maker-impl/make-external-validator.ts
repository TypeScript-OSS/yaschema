import _ from 'lodash';

import type { Validator } from '../../../types/validator';
import type { InternalValidationOptions, InternalValidator } from '../types/internal-validation';
import type { UnknownKeysByPath, UnknownKeysMeta } from '../types/unknown-keys-by-path';
import { unknownKeysSpecialMetaKey } from '../types/unknown-keys-by-path';
import { appendPathComponent, atPath, resolveLazyPath } from '../utils/path-utils';
import { checkUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous validator interface */
export const makeExternalValidator =
  (validator: InternalValidator): Validator =>
  (value, { failOnUnknownKeys = false } = {}) => {
    const unknownKeysByPath: UnknownKeysByPath = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'none',
      operationValidation: 'hard',
      schemaValidationPreferences: [],
      shouldProcessUnknownKeys: failOnUnknownKeys,
      shouldFailOnUnknownKeys: failOnUnknownKeys,
      shouldRemoveUnknownKeys: false,
      setAllowAllKeysForPath: (path) => {
        const resolvedMetaPath = resolveLazyPath(appendPathComponent(path, unknownKeysSpecialMetaKey));
        _.update(unknownKeysByPath, resolvedMetaPath.parts, (old: UnknownKeysMeta | undefined) => ({ ...old, allowAll: true }));
      },
      registerPotentiallyUnknownKeysForPath: (path, keys) => {
        const resolvedMetaPath = resolveLazyPath(appendPathComponent(path, unknownKeysSpecialMetaKey));
        let unknownKeysSet: Set<string> | undefined;
        _.update(unknownKeysByPath, resolvedMetaPath.parts, (old: UnknownKeysMeta | undefined) => {
          old = old ?? {};
          if (old.unknownKeys === undefined) {
            unknownKeysSet = keys();
            old.unknownKeys = unknownKeysSet;
            old.path = path;
          } else {
            unknownKeysSet = old.unknownKeys;
          }

          return old;
        });
        return unknownKeysSet;
      },
      workingValue: undefined,
      modifyWorkingValueAtPath: () => {
        // No-op
      },
      shouldRelax: () => false,
      relax: () => sleep(0)
    };

    let output = validator(value, internalOptions, () => {});

    const shouldFailOnUnknownKeys = failOnUnknownKeys && output.error === undefined;
    if (shouldFailOnUnknownKeys) {
      const checked = checkUnknownKeys({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        root: internalOptions.workingValue,
        unknownKeysByPath,
        shouldFailOnUnknownKeys: output.error === undefined && failOnUnknownKeys,
        shouldRemoveUnknownKeys: false,
        validationMode: 'hard'
      });
      output = output ?? checked.error;
    }

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath).string,
        errorLevel: output.errorLevel
      };
    } else {
      return {};
    }
  };
