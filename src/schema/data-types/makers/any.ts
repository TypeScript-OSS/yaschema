import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalValidationResult } from '../../internal/types/internal-validation';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeClonedValueNoError } from '../../internal/utils/make-no-error.js';
import { supportVariableSerializationFormsForBooleanValues } from '../../internal/utils/support-variable-serialization-forms-for-boolean-values.js';
import type { AnySchema } from '../types/AnySchema';

/** Requires a non-null, non-undefined value.  Use `allowNull` or `optional` if `null` or `undefined` values should also be allowed. */
export const any = (): AnySchema => new AnySchemaImpl();

// Helpers

class AnySchemaImpl extends InternalSchemaMakerImpl<any> implements AnySchema {
  // PureSchema Field Overrides

  public override readonly schemaType = 'any';

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  public override readonly valueType = undefined as any;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override readonly usesCustomSerDes = false;

  public override readonly isContainerType = false;

  // Public Methods

  public readonly clone: () => AnySchema = () => copyMetaFields({ from: this, to: new AnySchemaImpl() });

  // Method Overrides

  protected override overridableInternalValidateAsync = supportVariableSerializationFormsForBooleanValues(
    () => this,
    (value, _validatorOptions, path, _container, validationMode): InternalValidationResult => {
      if (validationMode === 'none') {
        return makeClonedValueNoError(value);
      }

      if (value === null || value === undefined) {
        return makeErrorResultForValidationMode(
          cloner(value),
          validationMode,
          () => `Expected any non-null/undefined value, found ${getMeaningfulTypeof(value)}`,
          path
        );
      }

      return makeClonedValueNoError(value);
    }
  );

  protected override overridableGetExtraToStringFields = undefined;
}
