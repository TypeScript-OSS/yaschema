import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { AsyncDeserializer } from '../../../types/deserializer';
import type { InternalAsyncValidator, MutableInternalValidationOptions } from '../types/internal-validation';
import type { ResolvedLazyPath } from '../types/lazy-path';
import type { UnknownKeysByPath, UnknownKeysMeta } from '../types/unknown-keys-by-path';
import { unknownKeysSpecialMetaKey } from '../types/unknown-keys-by-path';
import { appendPathComponent, atPath, resolveLazyPath } from '../utils/path-utils';
import { checkUnknownKeys, processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public async deserializer interface */
export const makeExternalAsyncDeserializer =
  <T>(validator: InternalAsyncValidator): AsyncDeserializer<T> =>
  async (value, { okToMutateInputValue = false, failOnUnknownKeys = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

    let wasWorkingValueCloned = false;
    const cloneWorkingValueIfNeeded = () => {
      if (okToMutateInputValue || wasWorkingValueCloned) {
        return; // Nothing to do
      }

      wasWorkingValueCloned = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      internalOptions.workingValue = _.cloneDeep(internalOptions.workingValue);
    };

    let hasModifiedValues = false;
    const modifiedPaths: Array<[ResolvedLazyPath, any]> = [];
    const unknownKeysByPath: UnknownKeysByPath = {};
    const internalOptions: MutableInternalValidationOptions = {
      transformation: 'deserialize',
      operationValidation: validation,
      schemaValidationPreferences: [],
      shouldProcessUnknownKeys: failOnUnknownKeys || removeUnknownKeys,
      shouldFailOnUnknownKeys: failOnUnknownKeys,
      shouldRemoveUnknownKeys: removeUnknownKeys,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      workingValue: value,
      modifyWorkingValueAtPath: (path, newValue) => {
        hasModifiedValues = true;
        const resolvedPath = resolveLazyPath(path);

        // If the root is replaced there's no need to clone and any previously set values don't matter
        if (resolvedPath.parts.length === 0) {
          wasWorkingValueCloned = true;
          modifiedPaths.length = 0;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        modifiedPaths.push([resolvedPath, newValue]);
      },
      shouldRelax: () => performance.now() - lastYieldTimeMSec > asyncMaxWorkIntervalMSec,
      relax: () => {
        lastYieldTimeMSec = performance.now();
        return sleep(0);
      }
    };

    let output = await validator(value, internalOptions, () => {});

    if (hasModifiedValues) {
      cloneWorkingValueIfNeeded();

      // For deserialize, we update the object after validation
      for (const [resolvedPath, newValue] of modifiedPaths) {
        if (resolvedPath.parts.length === 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          internalOptions.workingValue = newValue;
        } else {
          _.set(internalOptions.workingValue, resolvedPath.parts, newValue);
        }
      }
    }

    const shouldFailOnUnknownKeys = failOnUnknownKeys && output.error === undefined;
    const shouldRemoveUnknownKeys = removeUnknownKeys && (output.error === undefined || output.errorLevel !== 'error');
    if (shouldFailOnUnknownKeys || shouldRemoveUnknownKeys) {
      const checked = checkUnknownKeys({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        root: internalOptions.workingValue,
        unknownKeysByPath,
        shouldFailOnUnknownKeys: output.error === undefined && failOnUnknownKeys,
        shouldRemoveUnknownKeys: removeUnknownKeys,
        validationMode: validation
      });
      output = output ?? checked.error;

      if (checked.needsRemovalProcessing) {
        cloneWorkingValueIfNeeded();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        processRemoveUnknownKeys({ root: internalOptions.workingValue, unknownKeysByPath });
      }
    }

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath).string,
        errorLevel: output.errorLevel,
        deserialized: internalOptions.workingValue as T
      };
    } else {
      return { deserialized: internalOptions.workingValue as T };
    }
  };
