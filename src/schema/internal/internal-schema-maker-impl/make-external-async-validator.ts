import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { AsyncValidator } from '../../../types/validator';
import type { InternalAsyncValidator, InternalValidationOptions } from '../types/internal-validation';
import type { UnknownKeysByPath, UnknownKeysMeta } from '../types/unknown-keys-by-path';
import { unknownKeysSpecialMetaKey } from '../types/unknown-keys-by-path';
import { appendPathComponent, atPath, resolveLazyPath } from '../utils/path-utils';
import { checkUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public async validator interface */
export const makeExternalAsyncValidator =
  (validator: InternalAsyncValidator): AsyncValidator =>
  async (value, { failOnUnknownKeys = false } = {}) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

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
      shouldRelax: () => performance.now() - lastYieldTimeMSec > asyncMaxWorkIntervalMSec,
      relax: () => {
        lastYieldTimeMSec = performance.now();
        return sleep(0);
      }
    };

    let output = await validator(value, internalOptions, () => {});

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
