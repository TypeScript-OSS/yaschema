import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator } from '../../internal/types/internal-validation';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { makeNoError } from '../../internal/utils/make-no-error.js';
import type { AllowNullSchema } from '../types/AllowNullSchema';

/** Requires that either the specified schema is satisfied or that the value is `null`. */
export const allowNull = <NonNullValueT>(schema: Schema<NonNullValueT>): AllowNullSchema<NonNullValueT> => new AllowNullSchemaImpl(schema);

// Helpers

class AllowNullSchemaImpl<NonNullValueT> extends InternalSchemaMakerImpl<NonNullValueT | null> implements AllowNullSchema<NonNullValueT> {
  // Public Fields

  public readonly schema: Schema<NonNullValueT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'allowNull';

  public override readonly valueType = undefined as any as NonNullValueT | null;

  public override readonly estimatedValidationTimeComplexity;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  public override readonly usesCustomSerDes;

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

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) => {
    if (value === null) {
      return makeNoError(value);
    }

    return (this.schema as any as InternalSchemaFunctions).internalValidateAsync(value, internalState, path, container, validationMode);
  };

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema
  });
}
