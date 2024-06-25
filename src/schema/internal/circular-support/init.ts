import { allowNull } from '../../marker-types/makers/allow-null.js';
import { not } from '../../marker-types/makers/not.js';
import { optional } from '../../marker-types/makers/optional.js';
import { setDynamicAllowNull, setDynamicNot, setDynamicOptional } from './funcs.js';

setDynamicAllowNull(allowNull);
setDynamicNot(not);
setDynamicOptional(optional);
