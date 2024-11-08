import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator } from '../../internal/types/internal-validation';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { makeNoError } from '../../internal/utils/make-no-error.js';
import type { OptionalSchema } from '../types/OptionalSchema';

/** Requires that either the specified schema is satisfied or that the value is `undefined`. */
export const optional = <DefinedValueT>(schema: Schema<DefinedValueT>): OptionalSchema<DefinedValueT> => new OptionalSchemaImpl(schema);

// Helpers

class OptionalSchemaImpl<DefinedValueT>
  extends InternalSchemaMakerImpl<DefinedValueT | undefined>
  implements OptionalSchema<DefinedValueT>
{
  // Public Fields

  public readonly schema: Schema<DefinedValueT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'optional';

  public override readonly valueType = undefined as any as DefinedValueT | undefined;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = false;

  // Initialization

  constructor(schema: Schema<DefinedValueT>) {
    super();

    this.schema = schema;

    this.estimatedValidationTimeComplexity = schema.estimatedValidationTimeComplexity;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;
    this.usesCustomSerDes = schema.usesCustomSerDes;
  }

  // Public Methods

  public readonly clone = (): OptionalSchema<DefinedValueT> => copyMetaFields({ from: this, to: optional(this.schema) });

  // Method Overrides

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) => {
    if (value === undefined) {
      return makeNoError(value);
    }

    return (this.schema as any as InternalSchemaFunctions).internalValidateAsync(value, internalState, path, container, validationMode);
  };

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema
  });
}
