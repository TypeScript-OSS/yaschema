import type { Schema } from '../../types/schema';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';

/** A special marker schema for named types, useful for code generation tools.  Roots are not cloneable. */
export interface RootSchema<ValueT> extends Schema<ValueT> {
  schemaType: 'root';
  name: string;
  schema: Schema<ValueT>;
}

/**
 * Requires the specified schema but marks this as a type that can be referenced by name.
 *
 * This is most useful when using automatic code generation tools.
 */
export const root = <ValueT>(name: string, schema: Schema<ValueT>) => new RootSchemaImpl(name, schema);

// Helpers

class RootSchemaImpl<ValueT> extends InternalSchemaMakerImpl<ValueT> implements RootSchema<ValueT> {
  // Public Fields

  public readonly name: string;

  public readonly schema: Schema<ValueT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'root';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = false;

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

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) =>
    (this.schema as any as InternalSchemaFunctions).internalValidate(value, internalState, path, container, validationMode);

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (
    value,
    internalState,
    path,
    container,
    validationMode
  ) => (this.schema as any as InternalSchemaFunctions).internalValidateAsync(value, internalState, path, container, validationMode);

  protected override overridableGetExtraToStringFields = () => ({
    schema: this.schema
  });
}
