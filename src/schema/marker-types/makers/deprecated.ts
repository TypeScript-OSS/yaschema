import { getLogger } from '../../../config/logging.js';
import { withResolved } from '../../../internal/utils/withResolved.js';
import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator } from '../../internal/types/internal-validation';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { isErrorResult } from '../../internal/utils/is-error-result.js';
import { makeNoError } from '../../internal/utils/make-no-error.js';
import type { DeprecatedSchema } from '../types/DeprecatedSchema';

const alreadyLogDeprecationWarnings = new Set<string>();

/**
 * Requires either `undefined` or the specified schema to be satisfied.  However, if the specified schema is satisfied, a warning is logged
 * (once per `uniqueName` per runtime instance).
 *
 * @see `setLogger`
 */
export const deprecated = <ValueT>(uniqueName: string, schema: Schema<ValueT>, options?: { deadline?: string }): DeprecatedSchema<ValueT> =>
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

  public override readonly estimatedValidationTimeComplexity;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  public override readonly usesCustomSerDes;

  public override readonly isContainerType = () => false;

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

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) => {
    if (value === undefined) {
      return makeNoError(value);
    }

    const result = (this.schema as any as InternalSchemaFunctions).internalValidateAsync(
      value,
      internalState,
      path,
      container,
      validationMode
    );
    return withResolved(result, (result) => {
      if (isErrorResult(result)) {
        return result;
      }

      if (value !== undefined && !alreadyLogDeprecationWarnings.has(this.uniqueName)) {
        alreadyLogDeprecationWarnings.add(this.uniqueName);
        getLogger().warn?.(
          `[DEPRECATION] ${this.uniqueName} is deprecated and will be removed ${
            this.deadline !== undefined ? `after ${this.deadline}` : 'soon'
          }.`,
          'debug'
        );
      }

      return result;
    });
  };

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema,
    deadline: this.deadline,
    uniqueName: this.uniqueName
  });
}
