import { forOfAsync } from '../../../internal/utils/forOfAsync.js';
import { once } from '../../../internal/utils/once.js';
import { withResolved } from '../../../internal/utils/withResolved.js';
import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import type { Schema } from '../../../types/schema';
import type { ValidationMode } from '../../../types/validation-options';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalState } from '../../internal/internal-schema-maker-impl/internal-state';
import type { GenericContainer } from '../../internal/types/generic-container';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidationErrorResult } from '../../internal/types/internal-validation';
import type { LazyPath } from '../../internal/types/lazy-path';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { isErrorResult } from '../../internal/utils/is-error-result.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeClonedValueNoError, makeNoError } from '../../internal/utils/make-no-error.js';
import type { OneOfSchema } from '../types/OneOfSchema';

/**
 * Requires at least one of the schemas be satisfied.
 *
 * The base form takes 2 schemas, but `oneOf3`, `oneOf4`, and `oneOf5` take more.  If you need even more than that, use something like
 * `oneOf(oneOf5(…), oneOf5(…))`
 */
export const oneOf = <TypeA, TypeB>(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>): OneOfSchema<TypeA, TypeB> =>
  new OneOfSchemaImpl(schemaA, schemaB);

export const oneOf3 = <TypeA, TypeB, TypeC>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>
): Schema<TypeA | TypeB | TypeC> => oneOf(schemaA, oneOf(schemaB, schemaC));

export const oneOf4 = <TypeA, TypeB, TypeC, TypeD>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>,
  schemaD: Schema<TypeD>
): Schema<TypeA | TypeB | TypeC | TypeD> => oneOf(schemaA, oneOf(schemaB, oneOf(schemaC, schemaD)));

export const oneOf5 = <TypeA, TypeB, TypeC, TypeD, TypeE>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>,
  schemaD: Schema<TypeD>,
  schemaE: Schema<TypeE>
): Schema<TypeA | TypeB | TypeC | TypeD | TypeE> => oneOf(schemaA, oneOf(schemaB, oneOf(schemaC, oneOf(schemaD, schemaE))));

// Helpers

/** Requires one of the specified schemas to be satisfied */
const validateOneOfAsync = <TypeA, TypeB>(
  value: any,
  schema: OneOfSchema<TypeA, TypeB>,
  internalState: InternalState,
  path: LazyPath,
  container: GenericContainer,
  validationMode: ValidationMode
) => {
  if (!schema.usesCustomSerDes() && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval() && validationMode === 'none') {
    return makeClonedValueNoError(value);
  }

  const validationErrors: InternalValidationErrorResult[] = [];

  let success = false;
  let outValue: any = undefined;
  let outInvalidValue: (() => any) | undefined = undefined;

  const processSubSchema = (subschema: Schema<TypeA> | Schema<TypeB>) => {
    const result = (subschema as any as InternalSchemaFunctions).internalValidateAsync(
      value,
      internalState,
      path,
      container,
      validationMode
    );
    return withResolved(result, (result) => {
      if (!isErrorResult(result)) {
        success = true;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        outValue = result.value;
        outInvalidValue = undefined;

        if (!schema.usesCustomSerDes() && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval()) {
          return makeClonedValueNoError(value);
        }
      } else {
        if (outValue === undefined) {
          outInvalidValue = result.invalidValue;
        }

        validationErrors.push(result);
      }

      return undefined;
    });
  };

  const processedSubSchemas = forOfAsync(schema.schemas, processSubSchema);
  return withResolved(processedSubSchemas, (processedSubSchemas) => {
    if (processedSubSchemas !== undefined) {
      return processedSubSchemas;
    }

    return success
      ? makeNoError(outValue)
      : makeErrorResultForValidationMode(
          outInvalidValue ?? cloner(value),
          validationMode,
          () => `Expected one of: ${validationErrors.map((r) => r.error?.() ?? '').join(' or ')}, found ${getMeaningfulTypeof(value)}`,
          path
        );
  });
};

class OneOfSchemaImpl<TypeA, TypeB> extends InternalSchemaMakerImpl<TypeA | TypeB> implements OneOfSchema<TypeA, TypeB> {
  // Public Fields

  public readonly schemas: [Schema<TypeA>, Schema<TypeB>];

  // PureSchema Field Overrides

  public override readonly schemaType = 'oneOf';

  public override readonly valueType = undefined as any as TypeA | TypeB;

  public override readonly estimatedValidationTimeComplexity;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  public override readonly usesCustomSerDes;

  public override readonly isContainerType = () => false;

  // Initialization

  constructor(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>) {
    super();

    this.schemas = [schemaA, schemaB];

    this.estimatedValidationTimeComplexity = once(
      () => schemaA.estimatedValidationTimeComplexity() + schemaB.estimatedValidationTimeComplexity()
    );
    this.usesCustomSerDes = once(() => schemaA.usesCustomSerDes() || schemaB.usesCustomSerDes());
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = once(
      () =>
        schemaA.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval() || schemaB.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval()
    );
  }

  // Public Methods

  public readonly clone = (): OneOfSchema<TypeA, TypeB> =>
    copyMetaFields({ from: this, to: new OneOfSchemaImpl(this.schemas[0], this.schemas[1]) });

  // Method Overrides

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) =>
    validateOneOfAsync(value, this, internalState, path, container, validationMode);

  protected override overridableGetExtraToStringFields = () => ({
    schemas: this.schemas
  });
}
