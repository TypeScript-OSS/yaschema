import type { InternalValidationErrorResult, InternalValidationResult } from '../types/internal-validation';

export const isErrorResult = (result: InternalValidationResult): result is InternalValidationErrorResult => result.error !== undefined;
