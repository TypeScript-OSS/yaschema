import type { Schema } from '../../../types/schema';

/** Requires a string matching the specified regular expression. */
export interface RegexSchema extends Schema<string> {
  schemaType: 'regex';
  clone: () => RegexSchema;

  regex: RegExp;

  minLength: number | undefined;
  maxLength: number | undefined;
  /** Sets (replaces) the `minLength` and `maxLength` fields for this schema and returns the same schema */
  setAllowedLengthRange: (minLength: number | undefined, maxLength: number | undefined) => this;
}
