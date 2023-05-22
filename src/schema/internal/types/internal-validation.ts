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

  /** If `true`, one or more of `shouldFailOnUnknownKeys` or `shouldRemoveUnknownKeys` is `true` */
  shouldProcessUnknownKeys: boolean;
  /** If `true`, unknown keys will cause errors unless schemas have `disableFailOnUnknownKeys` set to `true` */
  shouldFailOnUnknownKeys: boolean;
  /** If `true`, unknown keys will be removed unless schemas have `disableRemoveUnknownKeys` set to `true` */
  shouldRemoveUnknownKeys: boolean;

  setAllowAllKeysForPath: (path: LazyPath) => void;
  registerPotentiallyUnknownKeysForPath: (path: LazyPath, keys: () => Set<string>) => Set<string> | undefined;

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

export interface InternalValidationErrorResult {
  error: () => string;
  errorPath: LazyPath;
  errorLevel: ValidationErrorLevel;
}

export interface InternalValidationSuccessResult {
  error?: undefined;
  errorPath?: undefined;
  errorLevel?: undefined;
}

export type InternalValidationResult = InternalValidationErrorResult | InternalValidationSuccessResult;
