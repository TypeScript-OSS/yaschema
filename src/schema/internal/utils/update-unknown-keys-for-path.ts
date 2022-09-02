import type { InternalValidationOptions } from '../types/internal-validation';

export const updateUnknownKeysForPath = ({
  validatorOptions,
  path,
  value,
  mapKeys
}: {
  validatorOptions: InternalValidationOptions;
  path: string;
  value: Record<string, any>;
  mapKeys: string[];
}) => {
  const unknownKeys = validatorOptions.inoutUnknownKeysByPath[path];
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

    validatorOptions.inoutUnknownKeysByPath[path] = valueKeys;
  } else if (unknownKeys instanceof Set && unknownKeys.size > 0) {
    // If this path has been examined before and still has unknown keys

    for (const mapKey of mapKeys) {
      unknownKeys.delete(mapKey);
    }
  }
};
