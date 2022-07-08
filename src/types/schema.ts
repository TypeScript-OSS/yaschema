import type { PureSchema } from './pure-schema';
import type { SchemaFunctions } from './schema-functions';

/** A generic schema */
export type Schema<ValueT = any> = PureSchema<ValueT> &
  SchemaFunctions<ValueT> & {
    /** A marker that can be used for testing if this is a YaSchema schema */
    isYaSchema: true;
  };
