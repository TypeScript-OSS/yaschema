import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { atPath } from '../internal/utils/path-utils';

/** Requires a non-null, non-undefined value. */
export interface AnySchema extends Schema {
  schemaType: 'any';
  clone: () => AnySchema;
}

/** Requires a non-null, non-undefined value.  Use `allowNull` or `optional` if `null` or `undefined` values should also be allowed. */
export const any = (): AnySchema => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (validatorOptions.validation === 'none') {
      return noError;
    }

    if (value === null || value === undefined) {
      return { error: () => `Expected any non-null/undefined value, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
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
      usesCustomSerDes: false
    },
    { internalValidate }
  );

  return fullSchema;
};
