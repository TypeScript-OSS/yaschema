import _ from 'lodash';

import { safeClone } from '../../../internal/utils/safeClone';

export const cloner =
  <T>(value: T) =>
  () =>
    safeClone(value);
