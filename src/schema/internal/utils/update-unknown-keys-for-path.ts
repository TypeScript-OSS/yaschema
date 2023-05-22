import type { InternalValidationOptions } from '../types/internal-validation';
import type { LazyPath } from '../types/lazy-path';

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
  const unknownKeysSet = validatorOptions.registerPotentiallyUnknownKeysForPath(path, () => new Set(Object.keys(value)));
  if (unknownKeysSet !== undefined) {
    for (const mapKey of mapKeys) {
      unknownKeysSet.delete(mapKey);
    }
  }
};
