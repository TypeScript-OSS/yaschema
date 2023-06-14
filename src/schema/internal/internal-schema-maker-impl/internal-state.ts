import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { ValidationMode } from '../../../types/validation-options';
import type { InternalTransformationType } from '../types/internal-validation';
import type { LazyPath } from '../types/lazy-path';
import { sleep } from '../utils/sleep';

export class InternalState {
  public readonly transformation: InternalTransformationType;

  /** The operation-level validation mode */
  public readonly operationValidation: ValidationMode;

  /** If `true`, unknown keys will cause errors unless schemas have `disableFailOnUnknownKeys` set to `true` */
  public readonly shouldFailOnUnknownKeys: boolean;

  /** If `true`, unknown keys will be removed unless schemas have `disableRemoveUnknownKeys` set to `true` */
  public readonly shouldRemoveUnknownKeys: boolean;
  public readonly unknownKeysCheckers: Array<() => LazyPath | undefined> = [];

  // Private Fields

  private readonly asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
  private lastYieldTimeMSec = performance.now();

  // Initialization

  constructor({
    transformation,
    operationValidation,
    failOnUnknownKeys,
    removeUnknownKeys
  }: {
    transformation: InternalTransformationType;
    operationValidation: ValidationMode;
    failOnUnknownKeys: boolean;
    removeUnknownKeys: boolean;
  }) {
    this.transformation = transformation;
    this.operationValidation = operationValidation;
    this.shouldFailOnUnknownKeys = failOnUnknownKeys;
    this.shouldRemoveUnknownKeys = removeUnknownKeys;
  }

  // MutableInternalValidationOptions Methods

  public readonly checkForUnknownKeys = () => {
    for (const checker of this.unknownKeysCheckers) {
      const checked = checker();
      if (checked !== undefined) {
        return checked;
      }
    }

    return undefined;
  };

  /** In async mode, returns true whenever enough time has elapsed that we should yield ("relax") to other work being done */
  public readonly shouldRelax = () => performance.now() - this.lastYieldTimeMSec > this.asyncMaxWorkIntervalMSec;

  // This was originally called yield, but that seemed to be breaking expos minifier
  /** Waits to let other work be done */
  public readonly relax = () => {
    this.lastYieldTimeMSec = performance.now();
    return sleep(0);
  };
}
