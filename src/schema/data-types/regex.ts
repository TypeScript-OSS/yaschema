import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { atPath } from '../internal/utils/path-utils';

/** Requires a string matching the specified regular expression. */
export interface RegexSchema extends Schema<string> {
  schemaType: 'regex';
  clone: () => RegexSchema;

  regex: RegExp;
}

/** Requires a string matching the specified regular expression. */
export const regex = (pattern: RegExp): RegexSchema => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (typeof value !== 'string') {
      return { error: () => `Expected string, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
    }

    if (validatorOptions.validation === 'none') {
      return noError;
    }

    if (!pattern.test(value)) {
      return { error: () => `Expected string matching ${String(pattern)}, found non-matching string${atPath(path)}` };
    }

    return noError;
  };

  const fullSchema: RegexSchema = makeInternalSchema(
    {
      valueType: undefined as any as string,
      schemaType: 'regex',
      clone: () => copyMetaFields({ from: fullSchema, to: regex(fullSchema.regex) }),
      regex: pattern,
      estimatedValidationTimeComplexity: 1,
      usesCustomSerDes: false
    },
    { internalValidate }
  );

  return fullSchema;
};
