import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';

/** Requires that either the specified schema is satisfied or that the value is `undefined`. */
export interface OptionalSchema<DefinedValueT> extends Schema<DefinedValueT | undefined> {
  schemaType: 'optional';
  clone: () => OptionalSchema<DefinedValueT>;

  schema: Schema<DefinedValueT>;
}

/** Requires that either the specified schema is satisfied or that the value is `undefined`. */
export const optional = <DefinedValueT>(schema: Schema<DefinedValueT>) => new OptionalSchemaImpl(schema);

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

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (value === undefined) {
      return noError;
    }

    return (this.schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
  };

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    if (value === undefined) {
      return noError;
    }

    return (this.schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);
  };

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema
  });
}
