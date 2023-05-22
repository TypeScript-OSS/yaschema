import type { ValidationMode } from '../../../types/validation-options';
import type { InternalValidationErrorResult } from '../types/internal-validation';
import type { UnknownKeysByPath } from '../types/unknown-keys-by-path';
import { unknownKeysSpecialMetaKey } from '../types/unknown-keys-by-path';
import { atPath } from './path-utils';

export interface UnknownKeysState {
  error?: InternalValidationErrorResult;
  needsRemovalProcessing?: boolean;
}

export const checkUnknownKeys = ({
  root,
  unknownKeysByPath,
  shouldFailOnUnknownKeys,
  shouldRemoveUnknownKeys,
  validationMode
}: {
  root: any;
  unknownKeysByPath: UnknownKeysByPath;
  shouldFailOnUnknownKeys: boolean;
  shouldRemoveUnknownKeys: boolean;
  validationMode: ValidationMode;
}): UnknownKeysState => {
  if (root === null || typeof root !== 'object') {
    return {}; // Nothing more to do
  }

  let error: InternalValidationErrorResult | undefined;
  let needsRemovalProcessing = false;

  const meta = unknownKeysByPath[unknownKeysSpecialMetaKey];

  if (!(meta?.allowAll ?? false) && (meta?.unknownKeys?.size ?? 0) > 0) {
    const path = meta!.path!;

    if (shouldFailOnUnknownKeys) {
      if (validationMode === 'hard') {
        return { error: { error: () => `Unknown key: ${atPath(path)}`, errorLevel: 'error', errorPath: path } };
      }

      error = { error: () => `Unknown key: ${atPath(path)}`, errorLevel: 'warning', errorPath: path };
    } else if (shouldRemoveUnknownKeys) {
      needsRemovalProcessing = true;
    }
  }

  if ((!shouldRemoveUnknownKeys || needsRemovalProcessing) && (!shouldFailOnUnknownKeys || error !== undefined)) {
    return { error, needsRemovalProcessing };
  }

  for (const key of Object.keys(unknownKeysByPath)) {
    if (key === unknownKeysSpecialMetaKey) {
      continue;
    }

    const checked = checkUnknownKeys({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      root: root[key],
      unknownKeysByPath: unknownKeysByPath[key],
      shouldFailOnUnknownKeys,
      shouldRemoveUnknownKeys,
      validationMode
    });
    if (checked.error?.errorLevel === 'error') {
      return checked;
    }

    error = error ?? checked.error;
    needsRemovalProcessing = needsRemovalProcessing || (checked.needsRemovalProcessing ?? false);

    if ((!shouldRemoveUnknownKeys || needsRemovalProcessing) && (!shouldFailOnUnknownKeys || error !== undefined)) {
      return checked;
    }
  }

  return { error, needsRemovalProcessing };
};

/** Removes unknown keys, mutating the specified value */
export const processRemoveUnknownKeys = ({ root, unknownKeysByPath }: { root: any; unknownKeysByPath: UnknownKeysByPath }) => {
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    processRemoveUnknownKeys({ root: root[key], unknownKeysByPath: unknownKeysByPath[key] });
  }
};
