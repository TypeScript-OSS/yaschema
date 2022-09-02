import type { InternalValidationResult } from '../types/internal-validation';

export const isErrorResult = (result: InternalValidationResult) => result.error !== undefined;
