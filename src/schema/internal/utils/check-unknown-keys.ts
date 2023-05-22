import type { InternalState } from '../internal-schema-maker-impl/internal-state';
import type { InternalValidationErrorResult } from '../types/internal-validation';
import type { UnknownKeysByPath } from '../types/unknown-keys-by-path';
import { unknownKeysSpecialMetaKey } from '../types/unknown-keys-by-path';
import { atPath } from './path-utils';

export interface UnknownKeysState {
  error?: InternalValidationErrorResult;
  needsRemovalProcessing?: boolean;
}

export const checkUnknownKeys = (internalState: InternalState): UnknownKeysState =>
  internalCheckUnknownKeys(internalState.workingValue, internalState.unknownKeysByPath, internalState);

// Helpers

const internalCheckUnknownKeys = (root: any, unknownKeysByPath: UnknownKeysByPath, internalState: InternalState): UnknownKeysState => {
  if (root === null || typeof root !== 'object') {
    return {}; // Nothing more to do
  }

  let error: InternalValidationErrorResult | undefined;
  let needsRemovalProcessing = false;

  const meta = unknownKeysByPath[unknownKeysSpecialMetaKey];

  if (!(meta?.allowAll ?? false) && (meta?.unknownKeys?.size ?? 0) > 0) {
    const path = meta!.path!;

    if (internalState.shouldFailOnUnknownKeys) {
      if (internalState.operationValidation === 'hard') {
        return { error: { error: () => `Unknown key: ${atPath(path)}`, errorLevel: 'error', errorPath: path } };
      }

      error = { error: () => `Unknown key: ${atPath(path)}`, errorLevel: 'warning', errorPath: path };
    } else if (internalState.shouldRemoveUnknownKeys) {
      needsRemovalProcessing = true;
    }
  }

  if (
    (!internalState.shouldRemoveUnknownKeys || needsRemovalProcessing) &&
    (!internalState.shouldFailOnUnknownKeys || error !== undefined)
  ) {
    return { error, needsRemovalProcessing };
  }

  for (const key of Object.keys(unknownKeysByPath)) {
    if (key === unknownKeysSpecialMetaKey) {
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const checked = internalCheckUnknownKeys(root[key], unknownKeysByPath[key], internalState);
    if (checked.error?.errorLevel === 'error') {
      return checked;
    }

    error = error ?? checked.error;
    needsRemovalProcessing = needsRemovalProcessing || (checked.needsRemovalProcessing ?? false);

    if (
      (!internalState.shouldRemoveUnknownKeys || needsRemovalProcessing) &&
      (!internalState.shouldFailOnUnknownKeys || error !== undefined)
    ) {
      return checked;
    }
  }

  return { error, needsRemovalProcessing };
};
