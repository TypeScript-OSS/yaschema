import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';
import { cloner } from '../internal/utils/cloner';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';

/** Requires the first specified schema but the second cannot be satisfied. */
export interface NotSchema<ValueT, ExcludedT> extends Schema<Exclude<ValueT, ExcludedT>> {
  schemaType: 'not';
  clone: () => NotSchema<ValueT, ExcludedT>;

  schema: Schema<ValueT>;
  notSchema: Schema<ExcludedT>;
  expectedTypeName?: string;
}

/**
 * Requires the first specified schema but the second cannot be satisfied.
 *
 * Note that the TypeScript compiler may not compute a useful exclusion type in some cases.  For example, if `ValueT` is `string` and
 * `ExcludedT` is `'hello'`, the compile-time type of this schemas `valueType` field will be `string` since `Exclude<string, 'hello'>` is
 * still `string`.  However, runtime validation will still be performed as expected, allowing, for example, any string except `'hello'`.
 */
export const not = <ValueT, ExcludedT>(
  schema: Schema<ValueT>,
  notSchema: Schema<ExcludedT>,
  options?: { expectedTypeName?: string }
): NotSchema<ValueT, ExcludedT> => new NotSchemaImpl(schema, notSchema, options);

// Helpers

class NotSchemaImpl<ValueT, ExcludedT> extends InternalSchemaMakerImpl<Exclude<ValueT, ExcludedT>> implements NotSchema<ValueT, ExcludedT> {
  // Public Fields

  public readonly schema: Schema<ValueT>;

  public readonly notSchema: Schema<ExcludedT>;

  public readonly expectedTypeName?: string;

  // PureSchema Field Overrides

  public override readonly schemaType = 'not';

  public override readonly valueType = undefined as any as Exclude<ValueT, ExcludedT>;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = false;

  // Initialization

  constructor(schema: Schema<ValueT>, notSchema: Schema<ExcludedT>, { expectedTypeName }: { expectedTypeName?: string } = {}) {
    super();

    this.schema = schema;
    this.notSchema = notSchema;
    this.expectedTypeName = expectedTypeName;

    this.estimatedValidationTimeComplexity = schema.estimatedValidationTimeComplexity + notSchema.estimatedValidationTimeComplexity;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;
    this.usesCustomSerDes = schema.usesCustomSerDes;
  }

  // Public Methods

  public readonly clone = (): NotSchema<ValueT, ExcludedT> =>
    copyMetaFields({
      from: this,
      to: new NotSchemaImpl(this.schema, this.notSchema, { expectedTypeName: this.expectedTypeName })
    });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) => {
    const result = (this.notSchema as any as InternalSchemaFunctions).internalValidate(
      value,
      internalState,
      path,
      container,
      validationMode
    );
    if (!isErrorResult(result)) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () =>
          this.expectedTypeName !== undefined
            ? `Expected ${this.expectedTypeName}, found ${getMeaningfulTypeof(value)}`
            : `Encountered an unsupported value, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return (this.schema as any as InternalSchemaFunctions).internalValidate(value, internalState, path, container, validationMode);
  };

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (
    value,
    internalState,
    path,
    container,
    validationMode
  ) => {
    const result = await (this.notSchema as any as InternalSchemaFunctions).internalValidateAsync(
      value,
      internalState,
      path,
      container,
      validationMode
    );
    if (!isErrorResult(result)) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () =>
          this.expectedTypeName !== undefined
            ? `Expected ${this.expectedTypeName}, found ${getMeaningfulTypeof(value)}`
            : `Encountered an unsupported value, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return (this.schema as any as InternalSchemaFunctions).internalValidateAsync(value, internalState, path, container, validationMode);
  };

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema,
    notSchema: this.notSchema,
    expectedTypeName: this.expectedTypeName
  });
}
