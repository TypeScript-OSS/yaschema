import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { SchemaPreferredValidationMode, SchemaPreferredValidationModeDepth } from '../../../types/schema-preferred-validation';
import type { ValidationMode } from '../../../types/validation-options';
import { noError } from '../consts';
import type { InternalTransformationType, InternalValidationResult, MutableInternalValidationOptions } from '../types/internal-validation';
import type { ResolvedLazyPath } from '../types/lazy-path';
import type { UnknownKeysByPath, UnknownKeysMeta } from '../types/unknown-keys-by-path';
import { unknownKeysSpecialMetaKey } from '../types/unknown-keys-by-path';
import { checkUnknownKeys } from '../utils/check-unknown-keys';
import { appendPathComponent, resolveLazyPath } from '../utils/path-utils';
import { processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

export class InternalState implements MutableInternalValidationOptions {
  // Public Fields

  public readonly modifiedPaths: Array<[ResolvedLazyPath, any]> = [];
  public readonly unknownKeysByPath: UnknownKeysByPath = {};

  // MutableInternalValidationOptions Fields

  public readonly transformation: InternalTransformationType;
  public readonly operationValidation: ValidationMode;
  public readonly schemaValidationPreferences: {
    mode: SchemaPreferredValidationMode;
    depth: SchemaPreferredValidationModeDepth;
    isContainerType: boolean;
  }[] = [];
  public readonly shouldProcessUnknownKeys: boolean;
  public readonly shouldFailOnUnknownKeys: boolean;
  public readonly shouldRemoveUnknownKeys: boolean;
  public get workingValue(): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.workingValue_;
  }

  // Private Fields

  private readonly asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
  private lastYieldTimeMSec = performance.now();
  private readonly okToMutateInputValue: boolean;
  private wasWorkingValueCloned = false;
  private workingValue_: any;

  // Initialization

  constructor(
    value: any,
    {
      transformation,
      operationValidation,
      okToMutateInputValue,
      failOnUnknownKeys,
      removeUnknownKeys
    }: {
      transformation: InternalTransformationType;
      operationValidation: ValidationMode;
      okToMutateInputValue: boolean;
      failOnUnknownKeys: boolean;
      removeUnknownKeys: boolean;
    }
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.workingValue_ = value;
    this.transformation = transformation;
    this.operationValidation = operationValidation;
    this.okToMutateInputValue = okToMutateInputValue;
    this.shouldProcessUnknownKeys = failOnUnknownKeys || removeUnknownKeys;
    this.shouldFailOnUnknownKeys = failOnUnknownKeys;
    this.shouldRemoveUnknownKeys = removeUnknownKeys;
  }

  // MutableInternalValidationOptions Methods

  public readonly setAllowAllKeysForPath: MutableInternalValidationOptions['setAllowAllKeysForPath'] = (path) => {
    const resolvedMetaPath = resolveLazyPath(appendPathComponent(path, unknownKeysSpecialMetaKey));
    _.update(this.unknownKeysByPath, resolvedMetaPath.parts, (old: UnknownKeysMeta | undefined) => ({ ...old, allowAll: true }));
  };

  public readonly registerPotentiallyUnknownKeysForPath: MutableInternalValidationOptions['registerPotentiallyUnknownKeysForPath'] = (
    path,
    keys
  ) => {
    const resolvedMetaPath = resolveLazyPath(appendPathComponent(path, unknownKeysSpecialMetaKey));
    let unknownKeysSet: Set<string> | undefined;
    _.update(this.unknownKeysByPath, resolvedMetaPath.parts, (old: UnknownKeysMeta | undefined) => {
      old = old ?? {};
      if (old.unknownKeys === undefined) {
        unknownKeysSet = keys();
        old.unknownKeys = unknownKeysSet;
        old.path = path;
      } else {
        unknownKeysSet = old.unknownKeys;
      }

      return old;
    });
    return unknownKeysSet;
  };

  public readonly modifyWorkingValueAtPath: MutableInternalValidationOptions['modifyWorkingValueAtPath'] = (path, newValue) => {
    const resolvedPath = resolveLazyPath(path);

    // If the root is replaced there's no need to clone and any previously set values don't matter
    if (resolvedPath.parts.length === 0) {
      this.wasWorkingValueCloned = true;
      this.modifiedPaths.length = 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.modifiedPaths.push([resolvedPath, newValue]);
  };

  public readonly shouldRelax: MutableInternalValidationOptions['shouldRelax'] = () =>
    performance.now() - this.lastYieldTimeMSec > this.asyncMaxWorkIntervalMSec;

  public readonly relax: MutableInternalValidationOptions['relax'] = () => {
    this.lastYieldTimeMSec = performance.now();
    return sleep(0);
  };

  // Public Methods

  public readonly applyWorkingValueModifications = () => {
    if (this.modifiedPaths.length === 0) {
      return;
    }

    this.cloneWorkingValueIfNeeded();

    // For deserialize, we update the object after validation
    for (const [resolvedPath, newValue] of this.modifiedPaths) {
      if (resolvedPath.parts.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.workingValue_ = newValue;
      } else {
        _.set(this.workingValue_, resolvedPath.parts, newValue);
      }
    }
  };

  public readonly processUnknownKeysIfNeeded = (): InternalValidationResult => {
    if (!this.shouldFailOnUnknownKeys && !this.shouldRemoveUnknownKeys) {
      return noError;
    }

    const checked = checkUnknownKeys(this);
    if (checked.error?.error === undefined || checked.error.errorLevel !== 'error') {
      if (checked.needsRemovalProcessing) {
        this.cloneWorkingValueIfNeeded();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        processRemoveUnknownKeys(this);
      }
    }

    return checked.error ?? noError;
  };

  // Private Methods

  private readonly cloneWorkingValueIfNeeded = () => {
    if (this.okToMutateInputValue || this.wasWorkingValueCloned) {
      return; // Nothing to do
    }

    this.wasWorkingValueCloned = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.workingValue_ = _.cloneDeep(this.workingValue_);
  };
}
