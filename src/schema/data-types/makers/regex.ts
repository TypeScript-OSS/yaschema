import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalValidator } from '../../internal/types/internal-validation';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeNoError } from '../../internal/utils/make-no-error.js';
import type { RegexSchema } from '../types/RegexSchema';

/** Requires a string matching the specified regular expression. */
export const regex = <ValueT extends string = string>(pattern: RegExp): RegexSchema<ValueT> => new RegexSchemaImpl<ValueT>(pattern);

// Helpers

class RegexSchemaImpl<ValueT extends string = string> extends InternalSchemaMakerImpl<ValueT> implements RegexSchema<ValueT> {
  // Public Fields

  public readonly regex: RegExp;

  public minLength: number | undefined;

  public maxLength: number | undefined;

  // PureSchema Field Overrides

  public override readonly schemaType = 'regex';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override readonly usesCustomSerDes = false;

  public override readonly isContainerType = false;

  // Initialization

  constructor(pattern: RegExp) {
    super();

    this.regex = pattern;
    this.minLength = undefined;
    this.maxLength = undefined;
  }

  // Public Methods

  public readonly clone = (): RegexSchema<ValueT> =>
    copyMetaFields({ from: this, to: new RegexSchemaImpl<ValueT>(this.regex).setAllowedLengthRange(this.minLength, this.maxLength) });

  public readonly setAllowedLengthRange = (minLength: number | undefined, maxLength: number | undefined): this => {
    this.minLength = minLength;
    this.maxLength = maxLength;
    return this;
  };

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, _validatorOptions, path, _container, validationMode) => {
    if (typeof value !== 'string') {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected string, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    if (validationMode === 'none') {
      return makeNoError(value);
    }

    const length = value.length;

    if (this.minLength !== undefined && length < this.minLength) {
      return makeErrorResultForValidationMode(
        () => value,
        validationMode,
        () => `Expected at least ${this.minLength} characters in string, got ${length} characters`,
        path
      );
    } else if (this.maxLength !== undefined && length > this.maxLength) {
      return makeErrorResultForValidationMode(
        () => value,
        validationMode,
        () => `Expected at most ${this.maxLength} characters in string, got ${length} characters`,
        path
      );
    }

    if (!this.regex.test(value)) {
      return makeErrorResultForValidationMode(
        () => value,
        validationMode,
        () => `Expected string matching ${String(this.regex)}, found non-matching string`,
        path
      );
    }

    return makeNoError(value);
  };

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    regex: String(this.regex)
  });
}
