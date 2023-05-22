import type { InternalState } from '../internal-schema-maker-impl/internal-state';
import type { UnknownKeysByPath } from '../types/unknown-keys-by-path';
import { unknownKeysSpecialMetaKey } from '../types/unknown-keys-by-path';

/** Removes unknown keys, mutating the specified value */
export const processRemoveUnknownKeys = (internalState: InternalState) =>
  internalProcessRemoveUnknownKeys(internalState.workingValue, internalState.unknownKeysByPath);

// Helpers

const internalProcessRemoveUnknownKeys = (root: any, unknownKeysByPath: UnknownKeysByPath) => {
  if (root === null || typeof root !== 'object') {
    return; // Nothing more to do
  }

  const meta = unknownKeysByPath[unknownKeysSpecialMetaKey];

  if (!(meta?.allowAll ?? false)) {
    for (const key of meta?.unknownKeys ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete root[key];
    }
  }

  for (const key of Object.keys(unknownKeysByPath)) {
    if (key === unknownKeysSpecialMetaKey) {
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    internalProcessRemoveUnknownKeys(root[key], unknownKeysByPath[key]);
  }
};
