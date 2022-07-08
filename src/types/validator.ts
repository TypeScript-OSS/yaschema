/** If error is undefined, the result is a success.  Otherwise, there was a problem. */
export type ValidationResult = { error?: string };

/** Synchronously validates the specified value */
export type Validator = (value: any) => ValidationResult;

/** Asynchronously validates the specified value */
export type AsyncValidator = (value: any) => Promise<ValidationResult>;
