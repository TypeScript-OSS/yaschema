import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';

/** Requires a non-null, non-undefined value. */
export interface AnySchema extends Schema {
  schemaType: 'any';
  clone: () => AnySchema;
}

/** Requires a non-null, non-undefined value.  Use `allowNull` or `optional` if `null` or `undefined` values should also be allowed. */
export const any = (): AnySchema => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (validatorOptions.shouldRemoveUnknownKeys) {
      validatorOptions.inoutUnknownKeysByPath[path] = 'allow-all';
    }

    const validationMode = getValidationMode(validatorOptions);
    if (validationMode === 'none') {
      return noError;
    }

    if (value === null || value === undefined) {
      return makeErrorResultForValidationMode(
        validationMode,
        () => `Expected any non-null/undefined value, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return noError;
  };

  const fullSchema: AnySchema = makeInternalSchema(
    {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      valueType: undefined as any,
      schemaType: 'any',
      clone: () => copyMetaFields({ from: fullSchema, to: any() }),
      estimatedValidationTimeComplexity: 1,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: false,
      usesCustomSerDes: false
    },
    { internalValidate }
  );

  return fullSchema;
};
