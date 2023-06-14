import type { Schema } from '../../types/schema';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { makeNoError } from '../internal/utils/make-no-error';

/** Requires that either the specified schema is satisfied or that the value is `null`. */
export interface AllowNullSchema<NonNullValueT> extends Schema<NonNullValueT | null> {
  schemaType: 'allowNull';
  clone: () => AllowNullSchema<NonNullValueT>;

  schema: Schema<NonNullValueT>;
}

/** Requires that either the specified schema is satisfied or that the value is `null`. */
export const allowNull = <NonNullValueT>(schema: Schema<NonNullValueT>) => new AllowNullSchemaImpl(schema);

// Helpers

class AllowNullSchemaImpl<NonNullValueT> extends InternalSchemaMakerImpl<NonNullValueT | null> implements AllowNullSchema<NonNullValueT> {
  // Public Fields

  public readonly schema: Schema<NonNullValueT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'allowNull';

  public override readonly valueType = undefined as any as NonNullValueT | null;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = false;

  // Initialization

  constructor(schema: Schema<NonNullValueT>) {
    super();

    this.schema = schema;

    this.estimatedValidationTimeComplexity = schema.estimatedValidationTimeComplexity;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;
    this.usesCustomSerDes = schema.usesCustomSerDes;
  }

  // Public Methods

  public readonly clone = (): AllowNullSchema<NonNullValueT> => copyMetaFields({ from: this, to: new AllowNullSchemaImpl(this.schema) });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) => {
    if (value === null) {
      return makeNoError(value);
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
    if (value === null) {
      return makeNoError(value);
    }

    return (this.schema as any as InternalSchemaFunctions).internalValidateAsync(value, internalState, path, container, validationMode);
  };

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema
  });
}
