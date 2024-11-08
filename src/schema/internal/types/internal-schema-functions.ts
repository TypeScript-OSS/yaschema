import type { InternalAsyncValidator } from './internal-validation';

export interface InternalSchemaFunctions {
  /** Validates and potentially transforms the specified value.  If not provided, internalValidate is used */
  internalValidateAsync: InternalAsyncValidator;
}
