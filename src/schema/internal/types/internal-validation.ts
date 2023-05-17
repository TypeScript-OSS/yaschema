import type { SchemaPreferredValidationMode, SchemaPreferredValidationModeDepth } from '../../../types/schema-preferred-validation';
import type { ValidationErrorLevel } from '../../../types/validation-error-level';
import type { ValidationMode } from '../../../types/validation-options';
import type { LazyPath } from './lazy-path';

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
  inoutModifiedPaths: Map<string, any>;
  inoutUnknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>>;
  /** A value that's safe to modify by path  */
  workingValue?: Readonly<any>;
  modifyWorkingValueAtPath: (path: LazyPath, newValue: any) => void;

  /** In async mode, returns true whenever enough time has elapsed that we should yield ("relax") to other work being done */
  shouldRelax: () => boolean;
  // This was originally called yield, but that seemed to be breaking expos minifier
  /** Waits to let other work be done */
  relax: () => Promise<void>;
}

export type MutableInternalValidationOptions = Omit<InternalValidationOptions, 'workingValue'> & { workingValue?: any };

/** Synchronously validates and potentially transforms the specified value */
export type InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: LazyPath) => InternalValidationResult;

/** Asynchronously validates and potentially transforms the specified value */
export type InternalAsyncValidator = (
  value: any,
  validatorOptions: InternalValidationOptions,
  path: LazyPath
) => Promise<InternalValidationResult> | InternalValidationResult;

export type InternalValidationResult =
  | { error: () => string; errorPath: LazyPath; errorLevel: ValidationErrorLevel }
  | { error?: undefined; errorPath?: undefined; errorLevel?: undefined };
