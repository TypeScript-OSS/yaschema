import _ from 'lodash';

import type { InternalValidationOptions } from '../types/internal-validation';

/** Removes unknown keys, mutating the specified value */
export const processRemoveUnknownKeys = ({
  internalOptions,
  cloneWorkingValueIfNeeded,
  unknownKeysByPath
}: {
  internalOptions: InternalValidationOptions;
  cloneWorkingValueIfNeeded: () => void;
  unknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>>;
}) => {
  for (const [path, value] of Object.entries(unknownKeysByPath)) {
    if (value instanceof Set && value.size > 0) {
      cloneWorkingValueIfNeeded();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const obj = path === '' ? internalOptions.workingValue : _.get(internalOptions.workingValue, path);
      if (obj !== null && typeof obj === 'object') {
        for (const key of value) {
          _.unset(obj, key);
        }
      }
    }
  }
};
