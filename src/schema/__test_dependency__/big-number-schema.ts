import BigNumber from 'bignumber.js';

import { schema } from '../..';
import { makeSerDes } from '../../types/ser-des';
import type { CustomValidationResult } from '../data-types/makers/custom';

const bigNumberSerDes = makeSerDes({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  deserialize: (value) => ({ deserialized: new BigNumber(value.bignumber) }),
  isValueType: (value): value is BigNumber => BigNumber.isBigNumber(value),
  serialize: (value) => ({ serialized: { bignumber: value.toFixed() } }),
  serializedSchema: () => schema.object({ bignumber: schema.string() })
});

const validateBigNumber = (value: BigNumber): CustomValidationResult => {
  if (value.isNaN()) {
    return { error: 'Found NaN' };
  } else if (!value.isFinite()) {
    return { error: 'Found non-finite value' };
  }

  return {};
};

export const bigNumberSchema = schema.custom({
  typeName: 'BigNumber',
  serDes: bigNumberSerDes,
  customValidation: validateBigNumber
});
