import _ from 'lodash';

import type { InternalValidationResult } from '../types/internal-validation';

export const makeNoError = <ValueT>(value: ValueT): InternalValidationResult => ({ value });

export const makeClonedValueNoError = <ValueT>(value: ValueT): InternalValidationResult => ({ value: _.cloneDeep(value) });
