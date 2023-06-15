import { allowNull } from '../../marker-types/makers/allow-null';
import { not } from '../../marker-types/makers/not';
import { optional } from '../../marker-types/makers/optional';
import { setDynamicAllowNull, setDynamicNot, setDynamicOptional } from './funcs';

setDynamicAllowNull(allowNull);
setDynamicNot(not);
setDynamicOptional(optional);
