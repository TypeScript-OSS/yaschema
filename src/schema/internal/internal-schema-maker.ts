import type { CommonSchemaMeta, PureSchema } from '../../types/pure-schema';
import type { SchemaFunctions } from '../../types/schema-functions';
import type { InternalSchemaFunctions } from './types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from './types/internal-validation';

/** Adds functions such as `validate` and `optional` and the `isYaSchema` marker */
let globalMakeInternalSchema: InternalSchemaMaker;

/** This is the same as the public schema interface except that the internal validation methods are exposed and that properties added on top
 * of `PureSchema<ValueT>` are directly exposed */
export type InternalSchema<ValueT, PureSchemaT extends PureSchema<ValueT>> = PureSchemaT &
  SchemaFunctions<ValueT> &
  InternalSchemaFunctions & {
    /** A marker that can be used for testing if this is a YaSchema schema */
    isYaSchema: true;
  };

export interface InternalSchemaMakerArgs {
  /** Synchronously validates and potentially transforms the specified value */
  internalValidate: InternalValidator;
  /** Asynchronously validates and potentially transforms the specified value.  If not provided, internalValidate is used */
  internalValidateAsync?: InternalAsyncValidator;
}

/** A function that can be used to inject functionality into a `PureSchema`, turning it into an `InternalSchema`. */
export type InternalSchemaMaker = <ValueT, IncompletePureSchemaT extends Omit<PureSchema<ValueT>, keyof CommonSchemaMeta>>(
  pureSchema: IncompletePureSchemaT,
  args: InternalSchemaMakerArgs
) => InternalSchema<ValueT, IncompletePureSchemaT & CommonSchemaMeta>;

/** Adds functions such as `validate` and `optional` and the `isYaSchema` marker */
export const makeInternalSchema: InternalSchemaMaker = (pureSchema, args) => globalMakeInternalSchema(pureSchema, args);

/** Because there would otherwise by a circular dependency to conveniently support `allowNull`, `not`, and `optional`, we inject the support
 * for injecting functions on schemas */
export const setInternalSchemaMaker = (impl: InternalSchemaMaker) => (globalMakeInternalSchema = impl);
