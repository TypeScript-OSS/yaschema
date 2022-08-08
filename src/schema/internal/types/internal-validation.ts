import type { ValidationMode } from '../../../types/validation-options';

/**
 * - `'none'` - No transformation is performed (used for validation)
 * - `'serialize'` - The value is converted to JSON
 * - `'deserialize'` - The value is converted from JSON
 */
export type InternalTransformationType = 'none' | 'serialize' | 'deserialize';

export interface InternalValidationOptions {
  transformation: InternalTransformationType;
  validation: ValidationMode;

  /**
   * - For serialize: the paths who's values have been replaced as part of the transformation, and the values that were set
   * - For deserialize: the paths who's values should be replaced and the values to replace them with
   */
  inoutModifiedPaths: Record<string, any>;
  /** A value that's safe to modify by path  */
  workingValue?: any;

  /** In async mode, returns true whenever enough time has elapsed that we should yield to other work being done */
  shouldYield: () => boolean;
  /** Waits to let other work be done */
  yield: () => Promise<void>;
}

/** Synchronously validates and potentially transforms the specified value */
export type InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: string) => InternalValidationResult;

/** Asynchronously validates and potentially transforms the specified value */
export type InternalAsyncValidator = (
  value: any,
  validatorOptions: InternalValidationOptions,
  path: string
) => Promise<InternalValidationResult> | InternalValidationResult;

export interface InternalValidationResult {
  error?: () => string;
}
