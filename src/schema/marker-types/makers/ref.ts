import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator } from '../../internal/types/internal-validation';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import type { RefSchema } from '../types/RefSchema.js';

/** References a schema dynamically, which is helpful with cyclical types */
export const ref = <ValueT>(getSchema: () => Schema<ValueT>): RefSchema<ValueT> => new RefSchemaImpl(getSchema);

// Helpers

class RefSchemaImpl<ValueT> extends InternalSchemaMakerImpl<ValueT> implements RefSchema<ValueT> {
  // Public Fields

  public readonly getSchema: () => Schema<ValueT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'ref';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity = () => this.getSchema().estimatedValidationTimeComplexity();

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = () =>
    this.getSchema().isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval();

  public override readonly usesCustomSerDes = () => this.getSchema().usesCustomSerDes();

  public override readonly isContainerType = () => this.getSchema().isContainerType();

  // Initialization

  constructor(getSchema: () => Schema<ValueT>) {
    super();

    this.getSchema = getSchema;
  }

  // Public Methods

  public readonly clone = (): RefSchema<ValueT> => copyMetaFields({ from: this, to: new RefSchemaImpl(this.getSchema) });

  // Method Overrides

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) =>
    (this.getSchema() as any as InternalSchemaFunctions).internalValidateAsync(value, internalState, path, container, validationMode);

  protected override overridableGetExtraToStringFields = () => ({
    getSchema: this.getSchema
  });
}
