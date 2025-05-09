import { once as lodashOnce } from 'lodash-es';

export const once = <T extends (...args: any) => any>(func: T): T => lodashOnce(func);
