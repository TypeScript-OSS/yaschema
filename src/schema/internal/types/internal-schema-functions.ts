import type { InternalAsyncValidator, InternalValidator } from './internal-validation';

export interface InternalSchemaFunctions {
  /** Synchronously validates and potentially transforms the specified value */
  internalValidate: InternalValidator;
  /** Asynchronously validates and potentially transforms the specified value.  If not provided, internalValidate is used */
  internalValidateAsync: InternalAsyncValidator;
}
