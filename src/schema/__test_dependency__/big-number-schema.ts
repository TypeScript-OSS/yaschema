import BigNumber from 'bignumber.js';

import { schema, ValidationResult } from '../..';
import { makeSerDes } from '../../types/ser-des';

const bigNumberSerDes = makeSerDes<BigNumber>({
  deserialize: (value) => ({ deserialized: new BigNumber((value as { bignumber: string }).bignumber) }),
  isValueType: (value): value is BigNumber => BigNumber.isBigNumber(value),
  serialize: (value) => ({ serialized: { bignumber: value.toFixed() } }),
  serializedSchema: () => schema.object({ bignumber: schema.string() })
});

const validateBigNumber = (value: BigNumber): ValidationResult => {
  if (value.isNaN()) {
    return { error: 'Found NaN' };
  } else if (!value.isFinite()) {
    return { error: 'Found non-finite value' };
  }

  return {};
};

export const bigNumberSchema = schema.custom<BigNumber>({
  typeName: 'BigNumber',
  serDes: bigNumberSerDes,
  customValidation: validateBigNumber
});
