import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalValidationResult } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { supportVariableSerializationFormsForBooleanValues } from '../internal/utils/support-variable-serialization-forms-for-boolean-values';

/** Requires a non-null, non-undefined value. */
export interface AnySchema extends Schema {
  schemaType: 'any';
  clone: () => AnySchema;
}

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

  protected override overridableInternalValidate = supportVariableSerializationFormsForBooleanValues(
    () => this,
    (value, validatorOptions, path): InternalValidationResult => {
      if (validatorOptions.shouldProcessUnknownKeys) {
        validatorOptions.setAllowAllKeysForPath(path);
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
    }
  );

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = undefined;
}
