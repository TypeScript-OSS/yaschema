import type { ValidationOptions } from './validation-options.js';

export interface StringifyOptions extends ValidationOptions {
  replacer?: (this: any, key: string, value: any) => any;
  space?: string | number;
}
