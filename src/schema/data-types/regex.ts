import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
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

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);

    if (typeof value !== 'string') {
      return makeErrorResultForValidationMode(validationMode, () => `Expected string, found ${getMeaningfulTypeof(value)}`, path);
    }

    if (validationMode === 'none') {
      return noError;
    }

    if (!this.regex.test(value)) {
      return makeErrorResultForValidationMode(
        validationMode,
        () => `Expected string matching ${String(this.regex)}, found non-matching string`,
        path
      );
    }

    return noError;
  };

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    regex: String(this.regex)
  });
}
