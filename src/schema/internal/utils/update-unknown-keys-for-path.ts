import type { InternalValidationOptions } from '../types/internal-validation';
import type { LazyPath } from '../types/lazy-path';
import { resolveLazyPath } from './path-utils';

export const updateUnknownKeysForPath = ({
  validatorOptions,
  path,
  value,
  mapKeys
}: {
  validatorOptions: InternalValidationOptions;
  path: LazyPath;
  value: Record<string, any>;
  mapKeys: string[];
}) => {
  const resolvedPath = resolveLazyPath(path);
  const unknownKeys = validatorOptions.inoutUnknownKeysByPath[resolvedPath];
  if (unknownKeys === undefined) {
    // If this path hasn't been examined before

    let valueKeys: Set<string>;
    try {
      valueKeys = new Set(Object.keys(value));
    } catch (e) {
      // Ignoring just in case
      valueKeys = new Set<string>();
    }

    for (const mapKey of mapKeys) {
      valueKeys.delete(mapKey);
    }

    validatorOptions.inoutUnknownKeysByPath[resolvedPath] = valueKeys;
  } else if (unknownKeys instanceof Set && unknownKeys.size > 0) {
    // If this path has been examined before and still has unknown keys

    for (const mapKey of mapKeys) {
      unknownKeys.delete(mapKey);
    }
  }
};
