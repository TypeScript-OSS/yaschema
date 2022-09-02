import type { SchemaPreferredValidationMode, SchemaPreferredValidationModeDepth } from '../../../types/schema-preferred-validation';
import type { ValidationErrorLevel } from '../../../types/validation-error-level';
import type { ValidationMode } from '../../../types/validation-options';

/**
 * - `'none'` - No transformation is performed (used for validation)
 * - `'serialize'` - The value is converted to JSON
 * - `'deserialize'` - The value is converted from JSON
 */
export type InternalTransformationType = 'none' | 'serialize' | 'deserialize';

export interface InternalValidationOptions {
  transformation: InternalTransformationType;

  /** The operation-level validation mode */
  operationValidation: ValidationMode;
  /** A stack of validation mode preferences */
  schemaValidationPreferences: Array<{
    mode: SchemaPreferredValidationMode;
    depth: SchemaPreferredValidationModeDepth;
    isContainerType: boolean;
  }>;

  /** The unknown-key removal mode */
  shouldRemoveUnknownKeys: boolean;

  /**
   * - For serialize: the paths who's values have been replaced as part of the transformation, and the values that were set
   * - For deserialize: the paths who's values should be replaced and the values to replace them with
   */
  inoutModifiedPaths: Record<string, any>;
  inoutUnknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>>;
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

export type InternalValidationResult =
  | { error: () => string; errorPath: string; errorLevel: ValidationErrorLevel }
  | { error?: undefined; errorPath?: undefined; errorLevel?: undefined };
