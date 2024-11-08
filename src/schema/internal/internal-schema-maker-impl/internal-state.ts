import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec.js';
import type { TypeOrPromisedType } from '../../../types/TypeOrPromisedType.js';
import type { ValidationMode } from '../../../types/validation-options';
import type { InternalTransformationType } from '../types/internal-validation';

export class InternalState {
  public readonly transformation: InternalTransformationType;

  /** The operation-level validation mode */
  public readonly operationValidation: ValidationMode;

  // Private Fields

  private readonly asyncMaxWorkIntervalMSec_ = getAsyncMaxWorkIntervalMSec();
  private readonly deferred_: Array<() => void> = [];
  private lastYieldTimeMSec_ = performance.now();

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

  public readonly defer = (operation: () => void) => this.deferred_.push(operation);

  public readonly runDeferred = () => {
    for (const operation of this.deferred_) {
      operation();
    }
  };

  /** In async mode, returns true whenever enough time has elapsed that we should yield ("relax") to other work being done */
  public readonly shouldRelax = () => performance.now() - this.lastYieldTimeMSec_ > this.asyncMaxWorkIntervalMSec_;

  public readonly relaxIfNeeded = <ReturnT>(callback: () => TypeOrPromisedType<ReturnT>) => {
    if (this.shouldRelax()) {
      return new Promise<ReturnT>((resolve, reject) => {
        setTimeout(async () => {
          this.lastYieldTimeMSec_ = performance.now();

          try {
            const result = await callback();
            resolve(result);
          } catch (e) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(e);
          }
        }, 0);
      });
    }

    return callback();
  };
}
