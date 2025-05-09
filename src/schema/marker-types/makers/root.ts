import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator } from '../../internal/types/internal-validation';
import type { RootSchema } from '../types/RootSchema';

/**
 * Requires the specified schema but marks this as a type that can be referenced by name.
 *
 * This is most useful when using automatic code generation tools.
 */
export const root = <ValueT>(name: string, schema: Schema<ValueT>): RootSchema<ValueT> => new RootSchemaImpl(name, schema);

// Helpers

class RootSchemaImpl<ValueT> extends InternalSchemaMakerImpl<ValueT> implements RootSchema<ValueT> {
  // Public Fields

  public readonly name: string;

  public readonly schema: Schema<ValueT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'root';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  public override readonly usesCustomSerDes;

  public override readonly isContainerType = () => false;

  // Initialization

  constructor(name: string, schema: Schema<ValueT>) {
    super();

    this.name = name;
    this.schema = schema;

    this.estimatedValidationTimeComplexity = schema.estimatedValidationTimeComplexity;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;
    this.usesCustomSerDes = schema.usesCustomSerDes;
  }

  // Method Overrides

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) =>
    (this.schema as any as InternalSchemaFunctions).internalValidateAsync(value, internalState, path, container, validationMode);

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema
  });
}
