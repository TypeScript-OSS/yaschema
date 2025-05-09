import _ from 'lodash';

export const once = <T extends (...args: any) => any>(func: T): T => _.once(func);
