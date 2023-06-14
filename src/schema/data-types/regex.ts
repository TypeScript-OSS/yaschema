import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalValidator } from '../internal/types/internal-validation';
import { cloner } from '../internal/utils/cloner';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../internal/utils/make-no-error';

/** Requires a string matching the specified regular expression. */
export interface RegexSchema extends Schema<string> {
  schemaType: 'regex';
  clone: () => RegexSchema;

  regex: RegExp;
}

/** Requires a string matching the specified regular expression. */
export const regex = (pattern: RegExp): RegexSchema => new RegexSchemaImpl(pattern);

// Helpers

class RegexSchemaImpl extends InternalSchemaMakerImpl<string> implements RegexSchema {
  // Public Fields

  public readonly regex: RegExp;

  // PureSchema Field Overrides

  public override readonly schemaType = 'regex';

  public override readonly valueType = undefined as any as string;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override readonly usesCustomSerDes = false;

  public override readonly isContainerType = false;

  // Initialization

  constructor(pattern: RegExp) {
    super();

    this.regex = pattern;
  }

  // Public Methods

  public readonly clone = (): RegexSchema => copyMetaFields({ from: this, to: new RegexSchemaImpl(this.regex) });

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
