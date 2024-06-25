import { getAsyncTimeComplexityThreshold } from '../../../config/async-time-complexity-threshold.js';
import { getLogger } from '../../../config/logging.js';
import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../../internal/types/internal-validation';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { isErrorResult } from '../../internal/utils/is-error-result.js';
import type { UpgradedSchema } from '../types/UpgradedSchema';

const alreadyLogUpgradedWarnings = new Set<string>();

/**
 * Requires either and old schema or a new schema be satisfied.  However, a warning is logged if the new schema isn't satisfied and the old
 * schema is (once per `uniqueName` per runtime instance).
 *
 * @see `setLogger`
 */
export const upgraded = <OldT, NewT>(
  uniqueName: string,
  args: { old: Schema<OldT>; new: Schema<NewT> },
  options?: { deadline?: string }
): UpgradedSchema<OldT, NewT> => new UpgradedSchemaImpl(uniqueName, args, options);

// Helpers

class UpgradedSchemaImpl<OldT, NewT> extends InternalSchemaMakerImpl<OldT | NewT> implements UpgradedSchema<OldT, NewT> {
  // Public Fields

  public readonly oldSchema: Schema<OldT>;

  public readonly newSchema: Schema<NewT>;

  public readonly deadline?: string;

  public readonly uniqueName: string;

  // PureSchema Field Overrides

  public override readonly schemaType = 'upgraded';

  public override readonly valueType = undefined as any as OldT | NewT;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = false;

  // Initialization

  constructor(
    uniqueName: string,
    { old: oldSchema, new: newSchema }: { old: Schema<OldT>; new: Schema<NewT> },
    { deadline }: { deadline?: string } = {}
  ) {
    super();

    this.uniqueName = uniqueName;
    this.oldSchema = oldSchema;
    this.newSchema = newSchema;
    this.deadline = deadline;

    this.estimatedValidationTimeComplexity = oldSchema.estimatedValidationTimeComplexity + newSchema.estimatedValidationTimeComplexity;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
      oldSchema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval || newSchema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;
    this.usesCustomSerDes = oldSchema.usesCustomSerDes || newSchema.usesCustomSerDes;
  }

  // Public Methods

  public readonly clone = (): UpgradedSchema<OldT, NewT> =>
    copyMetaFields({
      from: this,
      to: new UpgradedSchemaImpl(this.uniqueName, { old: this.oldSchema, new: this.newSchema }, { deadline: this.deadline })
    });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) => {
    const newResult = (this.newSchema as any as InternalSchemaFunctions).internalValidate(
      value,
      internalState,
      path,
      container,
      validationMode
    );
    if (!isErrorResult(newResult)) {
      return newResult;
    }

    const oldResult = (this.oldSchema as any as InternalSchemaFunctions).internalValidate(
      value,
      internalState,
      path,
      container,
      validationMode
    );
    if (!isErrorResult(oldResult)) {
      if (value !== undefined && !alreadyLogUpgradedWarnings.has(this.uniqueName)) {
        alreadyLogUpgradedWarnings.add(this.uniqueName);
        getLogger().warn?.(
          `[DEPRECATION] The schema for ${this.uniqueName} has been upgraded and legacy support will be removed ${
            this.deadline !== undefined ? `after ${this.deadline}` : 'soon'
          }.`,
          'debug'
        );
      }

      return oldResult;
    } else {
      return newResult;
    }
  };

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (
    value,
    internalState,
    path,
    container,
    validationMode
  ) => {
    const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();

    const newResult =
      this.newSchema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (this.newSchema as any as InternalSchemaFunctions).internalValidateAsync(
            value,
            internalState,
            path,
            container,
            validationMode
          )
        : (this.newSchema as any as InternalSchemaFunctions).internalValidate(value, internalState, path, container, validationMode);
    if (!isErrorResult(newResult)) {
      return newResult;
    }

    const oldResult =
      this.oldSchema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (this.oldSchema as any as InternalSchemaFunctions).internalValidateAsync(
            value,
            internalState,
            path,
            container,
            validationMode
          )
        : (this.oldSchema as any as InternalSchemaFunctions).internalValidate(value, internalState, path, container, validationMode);
    if (!isErrorResult(oldResult)) {
      if (value !== undefined && !alreadyLogUpgradedWarnings.has(this.uniqueName)) {
        alreadyLogUpgradedWarnings.add(this.uniqueName);
        getLogger().warn?.(
          `[DEPRECATION] The schema for ${this.uniqueName} has been upgraded and legacy support will be removed ${
            this.deadline !== undefined ? `after ${this.deadline}` : 'soon'
          }.`,
          'debug'
        );
      }

      return oldResult;
    } else {
      return newResult;
    }
  };

  protected override overridableGetExtraToStringFields = () => ({
    oldSchema: this.oldSchema,
    newSchema: this.newSchema,
    deadline: this.deadline,
    uniqueName: this.uniqueName
  });
}
