import { once } from '../../../internal/utils/once.js';
import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator } from '../../internal/types/internal-validation';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import type { RefSchema } from '../types/RefSchema.js';

export interface RefOptions {
  estimatedValidationTimeComplexity?: number;
  isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval?: boolean;
  usesCustomSerDes?: boolean;
}

/** References a schema dynamically, which is helpful with cyclical types */
export const ref = <ValueT>(getSchema: () => Schema<ValueT>, options?: RefOptions): RefSchema<ValueT> =>
  new RefSchemaImpl(getSchema, options);

// Helpers

class RefSchemaImpl<ValueT> extends InternalSchemaMakerImpl<ValueT> implements RefSchema<ValueT> {
  // Public Fields

  public readonly getSchema: () => Schema<ValueT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'ref';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  public override readonly usesCustomSerDes;

  // Initialization

  constructor(
    getSchema: () => Schema<ValueT>,
    {
      estimatedValidationTimeComplexity = 1,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false,
      usesCustomSerDes = false
    }: RefOptions = {}
  ) {
    super();

    this.getSchema = getSchema;

    this.estimatedValidationTimeComplexity = () => estimatedValidationTimeComplexity;

    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = once(() => isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

    this.usesCustomSerDes = once(() => usesCustomSerDes);
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
