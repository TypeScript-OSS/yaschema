import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { ValidationMode } from '../../../types/validation-options';
import type { InternalTransformationType } from '../types/internal-validation';
import { sleep } from '../utils/sleep';

export class InternalState {
  public readonly transformation: InternalTransformationType;

  /** The operation-level validation mode */
  public readonly operationValidation: ValidationMode;

  // Private Fields

  private readonly asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
  private lastYieldTimeMSec = performance.now();

  // Initialization

  constructor({
    transformation,
    operationValidation
  }: {
    transformation: InternalTransformationType;
    operationValidation: ValidationMode;
  }) {
    this.transformation = transformation;
    this.operationValidation = operationValidation;
  }

  // MutableInternalValidationOptions Methods

  /** In async mode, returns true whenever enough time has elapsed that we should yield ("relax") to other work being done */
  public readonly shouldRelax = () => performance.now() - this.lastYieldTimeMSec > this.asyncMaxWorkIntervalMSec;

  // This was originally called yield, but that seemed to be breaking expos minifier
  /** Waits to let other work be done */
  public readonly relax = () => {
    this.lastYieldTimeMSec = performance.now();
    return sleep(0);
  };
}
