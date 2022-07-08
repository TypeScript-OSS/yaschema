import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { CommonSchemaOptions } from '../internal/types/common-schema-options';
import type { InternalValidator } from '../internal/types/internal-validation';
import { atPath } from '../internal/utils/path-utils';

/** Requires a non-null, non-undefined value. */
export interface AnySchema extends Schema {
  schemaType: 'any';
}

/** Requires a non-null, non-undefined value.  Use `allowNull` or `optional` if `null` or `undefined` values should also be allowed. */
export const any = (options: CommonSchemaOptions = {}): AnySchema => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (validatorOptions.validation === 'none') {
      return noError;
    }

    if (value === null || value === undefined) {
      return { error: () => `Expected any non-null/undefined value, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
    }

    return noError;
  };

  return makeInternalSchema(
    {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      valueType: undefined as any,
      schemaType: 'any',
      ...options,
      estimatedValidationTimeComplexity: 1,
      usesCustomSerDes: false
    },
    { internalValidate }
  );
};
