import { safeClone } from '../../../internal/utils/safeClone.js';
import type { InternalValidationResult } from '../types/internal-validation';

export const makeNoError = <ValueT>(value: ValueT): InternalValidationResult => ({ value });

export const makeClonedValueNoError = <ValueT>(value: ValueT): InternalValidationResult => ({ value: safeClone(value) });
