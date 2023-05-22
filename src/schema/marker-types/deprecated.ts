import { getLogger } from '../../config/logging';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { isErrorResult } from '../internal/utils/is-error-result';

const alreadyLogDeprecationWarnings = new Set<string>();

/** Requires either `undefined` or the specified schema to be satisfied. */
export interface DeprecatedSchema<ValueT> extends Schema<ValueT | undefined> {
  schemaType: 'deprecated';
  clone: () => DeprecatedSchema<ValueT>;

  schema: Schema<ValueT>;
  deadline?: string;
  uniqueName: string;
}

/**
 * Requires either `undefined` or the specified schema to be satisfied.  However, if the specified schema is satisfied, a warning is logged
 * (once per `uniqueName` per runtime instance).
 *
 * @see `setLogger`
 */
export const deprecated = <ValueT>(uniqueName: string, schema: Schema<ValueT>, options?: { deadline?: string }) =>
  new DeprecatedSchemaImpl(uniqueName, schema, options);

// Helpers

class DeprecatedSchemaImpl<ValueT> extends InternalSchemaMakerImpl<ValueT | undefined> implements DeprecatedSchema<ValueT> {
  // Public Fields

  public readonly schema: Schema<ValueT>;

  public readonly deadline?: string;

  public readonly uniqueName: string;

  // PureSchema Field Overrides

  public override readonly schemaType = 'deprecated';

  public override readonly valueType = undefined as any as ValueT | undefined;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = false;

  // Initialization

  constructor(uniqueName: string, schema: Schema<ValueT>, { deadline }: { deadline?: string } = {}) {
    super();

    this.uniqueName = uniqueName;
    this.schema = schema;
    this.deadline = deadline;

    this.estimatedValidationTimeComplexity = schema.estimatedValidationTimeComplexity;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;
    this.usesCustomSerDes = schema.usesCustomSerDes;
  }

  // Public Methods

  public readonly clone = (): DeprecatedSchema<ValueT> =>
    copyMetaFields({ from: this, to: new DeprecatedSchemaImpl(this.uniqueName, this.schema, { deadline: this.deadline }) });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (value === undefined) {
      return noError;
    }

    const result = (this.schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (isErrorResult(result)) {
      return result;
    }

    if (value !== undefined && !alreadyLogDeprecationWarnings.has(this.uniqueName)) {
      alreadyLogDeprecationWarnings.add(this.uniqueName);
      getLogger().warn?.(
        `[DEPRECATION] ${this.uniqueName} is deprecated and will be removed ${this.deadline ? `after ${this.deadline}` : 'soon'}.`,
        'debug'
      );
    }

    return noError;
  };

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    if (value === undefined) {
      return noError;
    }

    const result = await (this.schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);
    if (isErrorResult(result)) {
      return result;
    }

    if (value !== undefined && !alreadyLogDeprecationWarnings.has(this.uniqueName)) {
      alreadyLogDeprecationWarnings.add(this.uniqueName);
      getLogger().warn?.(
        `[DEPRECATION] ${this.uniqueName} is deprecated and will be removed ${this.deadline ? `after ${this.deadline}` : 'soon'}.`,
        'debug'
      );
    }

    return noError;
  };

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema,
    deadline: this.deadline,
    uniqueName: this.uniqueName
  });
}
