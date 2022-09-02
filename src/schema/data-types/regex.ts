import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';

/** Requires a string matching the specified regular expression. */
export interface RegexSchema extends Schema<string> {
  schemaType: 'regex';
  clone: () => RegexSchema;

  regex: RegExp;
}

/** Requires a string matching the specified regular expression. */
export const regex = (pattern: RegExp): RegexSchema => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);

    if (typeof value !== 'string') {
      return makeErrorResultForValidationMode(validationMode, () => `Expected string, found ${getMeaningfulTypeof(value)}`, path);
    }

    if (validationMode === 'none') {
      return noError;
    }

    if (!pattern.test(value)) {
      return makeErrorResultForValidationMode(
        validationMode,
        () => `Expected string matching ${String(pattern)}, found non-matching string`,
        path
      );
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
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: false,
      usesCustomSerDes: false
    },
    { internalValidate }
  );

  return fullSchema;
};
