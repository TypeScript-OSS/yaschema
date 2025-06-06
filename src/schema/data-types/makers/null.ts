import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalAsyncValidator } from '../../internal/types/internal-validation.js';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeNoError } from '../../internal/utils/make-no-error.js';
import type { NullSchema } from '../types/NullSchema';

/** Requires a `null` value. */
export const nullValue = (): NullSchema => new NullSchemaImpl();

// Helpers

class NullSchemaImpl extends InternalSchemaMakerImpl<null> implements NullSchema {
  // PureSchema Field Overrides

  public override readonly schemaType = 'null';

  public override readonly valueType = undefined as any as null;

  public override readonly estimatedValidationTimeComplexity = () => 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = () => false;

  public override readonly usesCustomSerDes = () => false;

  // Public Methods

  public readonly clone = (): NullSchema => copyMetaFields({ from: this, to: new NullSchemaImpl() });

  // Method Overrides

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (
    value,
    _validatorOptions,
    path,
    _container,
    validationMode
  ) => {
    if (value !== null) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected null, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return makeNoError(value);
  };

  protected override overridableGetExtraToStringFields = undefined;
}
