import { allowNull } from '../../marker-types/allow-null';
import { not } from '../../marker-types/not';
import { optional } from '../../marker-types/optional';
import { setDynamicAllowNull, setDynamicNot, setDynamicOptional } from './funcs';

setDynamicAllowNull(allowNull);
setDynamicNot(not);
setDynamicOptional(optional);
