import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl';
import type { InternalValidator } from '../../internal/types/internal-validation';
import { cloner } from '../../internal/utils/cloner';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../../internal/utils/make-no-error';
import type { UndefinedSchema } from '../types/UndefinedSchema';

/** Requires a `undefined` value. */
export const undefinedValue = (): UndefinedSchema => new UndefinedSchemaImpl();

// Helpers

class UndefinedSchemaImpl extends InternalSchemaMakerImpl<undefined> implements UndefinedSchema {
  // PureSchema Field Overrides

  public override readonly schemaType = 'undefined';

  public override readonly valueType = undefined as any as undefined;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override readonly usesCustomSerDes = false;

  public override readonly isContainerType = false;

  // Public Methods

  public readonly clone = (): UndefinedSchema => copyMetaFields({ from: this, to: new UndefinedSchemaImpl() });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, _validatorOptions, path, _container, validationMode) => {
    if (value !== undefined) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected undefined, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return makeNoError(value);
  };

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = undefined;
}
