import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Range } from '../../types/range';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { atPath } from '../internal/utils/path-utils';
import { supportVariableSerializationFormsForNumericValues } from '../internal/utils/support-variable-serialization-forms-for-numeric-values';
import { validateValue } from '../internal/utils/validate-value';
import { validateValueInRange } from '../internal/utils/validate-value-in-range';

export interface RestrictedNumberOptions {
  /** If one or more values are specified, the value must be divisible by one of the specified options */
  divisibleBy?: number[];
}

/** Requires a real, finite number, optionally matching one of the specified values or in one of the specified ranges and optionally being
 * divisible by one of the specified divisors. */
export interface RestrictedNumberSchema extends Schema<number>, RestrictedNumberOptions {
  schemaType: 'restrictedNumber';
  clone: () => RestrictedNumberSchema;

  /** If one or more values are specified, the value must be equal to one of the specified values or in one of the specified ranges */
  allowedValuesAndRanges: Array<number | Range<number>>;

  /**
   * For serialization, the first type will be used. `['number']` is assumed if nothing is specified.
   *
   * For deserialization, forms are tried in order.
   */
  allowedSerializationForms?: Array<'number' | 'string'>;
  /** Sets (replaces) the allowed serialization forms metadata for this schema and returns the same schema */
  setAllowedSerializationForms: (allowed?: Array<'number' | 'string'>) => this;
}

/** Requires a real, finite number.  If one or more values and/or ranges are specified, the value must also be equal to one of the specified
 * values or in one of the specified ranges.  If one or more divisors are specified, the value must also be divisible by one of the
 * specified divisors. */
export const restrictedNumber = (
  allowedValuesAndRanges: Array<number | Range<number>>,
  { divisibleBy = [] }: RestrictedNumberOptions = {}
): RestrictedNumberSchema => {
  const allowedNumbers = allowedValuesAndRanges.filter((v): v is number => typeof v === 'number');
  const allowedRanges = allowedValuesAndRanges.filter((v): v is Range<number> => typeof v !== 'number');

  const allowedNumbersSet = new Set(allowedNumbers);

  const internalValidate: InternalValidator = supportVariableSerializationFormsForNumericValues(
    () => fullSchema,
    (value, validatorOptions, path) => {
      if (typeof value !== 'number') {
        return { error: () => `Expected number, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
      }

      if (validatorOptions.validation === 'none') {
        return noError;
      }

      if (Number.isNaN(value)) {
        return { error: () => `Found NaN${atPath(path)}` };
      } else if (!Number.isFinite(value)) {
        return { error: () => `Found non-finite value${atPath(path)}` };
      }

      if (allowedNumbers.length > 0) {
        const valueResult = validateValue(value, { allowed: allowedNumbersSet, path });
        if (valueResult.error !== undefined) {
          if (allowedRanges.length > 0) {
            const rangeResult = validateValueInRange(value, { allowed: allowedRanges, path });
            if (rangeResult.error !== undefined) {
              return rangeResult;
            }
          } else {
            return valueResult;
          }
        }
      } else if (allowedRanges.length > 0) {
        const rangeResult = validateValueInRange(value, { allowed: allowedRanges, path });
        if (rangeResult.error !== undefined) {
          return rangeResult;
        }
      }

      if (divisibleBy.length > 0) {
        return validateValueIsDivisibleBy(value, { allowed: divisibleBy, path });
      }

      return noError;
    }
  );

  const fullSchema: RestrictedNumberSchema = makeInternalSchema(
    {
      valueType: undefined as any as number,
      schemaType: 'restrictedNumber',
      clone: () =>
        copyMetaFields({
          from: fullSchema,
          to: restrictedNumber(fullSchema.allowedValuesAndRanges, { divisibleBy: fullSchema.divisibleBy }).setAllowedSerializationForms(
            fullSchema.allowedSerializationForms
          )
        }),
      allowedValuesAndRanges,
      divisibleBy,
      estimatedValidationTimeComplexity: allowedRanges.length + 1,
      usesCustomSerDes: false,
      setAllowedSerializationForms: (allowed?: Array<'number' | 'string'>) => {
        if (allowed === undefined || allowed.length === 0 || (allowed.length === 1 && allowed[0] === 'number')) {
          fullSchema.allowedSerializationForms = undefined;
          fullSchema.usesCustomSerDes = false;
        } else {
          fullSchema.allowedSerializationForms = allowed;
          fullSchema.usesCustomSerDes = true;
        }

        return fullSchema;
      }
    },
    { internalValidate }
  );

  return fullSchema;
};

// Helpers

const isValueDivisibleBy = (value: number, divisor: number) => value % divisor === 0;

const validateValueIsDivisibleBy = (value: number, { allowed, path }: { allowed: number[]; path: string }) => {
  if (allowed.find((divisor) => isValueDivisibleBy(value, divisor)) === undefined) {
    return {
      error: () => `Expected a value divisible by ${allowed.join(' or ')}, found ${getMeaningfulTypeof(value)}${atPath(path)}`
    };
  }

  return noError;
};
