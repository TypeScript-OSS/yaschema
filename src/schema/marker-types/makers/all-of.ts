import { getAsyncTimeComplexityThreshold } from '../../../config/async-time-complexity-threshold.js';
import type { Schema } from '../../../types/schema';
import type { ValidationMode } from '../../../types/validation-options';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalState } from '../../internal/internal-schema-maker-impl/internal-state';
import type { GenericContainer } from '../../internal/types/generic-container';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type {
  InternalAsyncValidator,
  InternalValidationErrorResult,
  InternalValidationResult,
  InternalValidator
} from '../../internal/types/internal-validation';
import type { LazyPath } from '../../internal/types/lazy-path';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { isErrorResult } from '../../internal/utils/is-error-result.js';
import { isMoreSevereResult } from '../../internal/utils/is-more-severe-result.js';
import { makeClonedValueNoError, makeNoError } from '../../internal/utils/make-no-error.js';
import type { AllOfSchema } from '../types/AllOfSchema';

/**
 * Requires all of the schemas be satisfied.
 *
 * The base form takes 2 schemas, but `allOf3`, `allOf4`, and `allOf5` take more.  If you need even more than that, use something like
 * `allOf(allOf5(…), allOf5(…))`
 */
export const allOf = <TypeA, TypeB>(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>): AllOfSchema<TypeA, TypeB> =>
  new AllOfSchemaImpl(schemaA, schemaB);

export const allOf3 = <TypeA, TypeB, TypeC>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>
): Schema<TypeA & TypeB & TypeC> => allOf(schemaA, allOf(schemaB, schemaC));

export const allOf4 = <TypeA, TypeB, TypeC, TypeD>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>,
  schemaD: Schema<TypeD>
): Schema<TypeA & TypeB & TypeC & TypeD> => allOf(schemaA, allOf(schemaB, allOf(schemaC, schemaD)));

export const allOf5 = <TypeA, TypeB, TypeC, TypeD, TypeE>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>,
  schemaD: Schema<TypeD>,
  schemaE: Schema<TypeE>
): Schema<TypeA & TypeB & TypeC & TypeD & TypeE> => allOf(schemaA, allOf(schemaB, allOf(schemaC, allOf(schemaD, schemaE))));

// Helpers

const validateAllOf = <TypeA, TypeB>(
  value: any,
  schema: AllOfSchema<TypeA, TypeB>,
  internalState: InternalState,
  path: LazyPath,
  container: GenericContainer,
  validationMode: ValidationMode
): InternalValidationResult => {
  const shouldStopOnFirstError =
    validationMode === 'hard' ||
    (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && internalState.transformation === 'none');

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return makeClonedValueNoError(value);
  }

  let errorResult: InternalValidationErrorResult | undefined = undefined;
  let outValue: any = undefined;
  let outInvalidValue: (() => any) | undefined = undefined;
  for (const subschema of schema.schemas) {
    const result = (subschema as any as InternalSchemaFunctions).internalValidate(value, internalState, path, container, validationMode);

    if (!isErrorResult(result)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      outValue = result.value;
    } else {
      if (outValue === undefined) {
        outInvalidValue = result.invalidValue;
      }
    }
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result as InternalValidationErrorResult;

      if (shouldStopOnFirstError) {
        return errorResult!;
      }
    }
  }

  return errorResult !== undefined
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      { ...errorResult, invalidValue: outValue !== undefined ? () => outValue : outInvalidValue! }
    : makeNoError(outValue);
};

const validateAllOfAsync = async <TypeA, TypeB>(
  value: any,
  schema: AllOfSchema<TypeA, TypeB>,
  internalState: InternalState,
  path: LazyPath,
  container: GenericContainer,
  validationMode: ValidationMode
): Promise<InternalValidationResult> => {
  const shouldStopOnFirstError =
    validationMode === 'hard' ||
    (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && internalState.transformation === 'none');

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return makeClonedValueNoError(value);
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();

  let errorResult: InternalValidationErrorResult | undefined = undefined;
  let outValue: any = undefined;
  let outInvalidValue: (() => any) | undefined = undefined;
  for (const subschema of schema.schemas) {
    const result =
      subschema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (subschema as any as InternalSchemaFunctions).internalValidateAsync(value, internalState, path, container, validationMode)
        : (subschema as any as InternalSchemaFunctions).internalValidate(value, internalState, path, container, validationMode);

    if (!isErrorResult(result)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      outValue = result.value;
    } else {
      if (outValue === undefined) {
        outInvalidValue = result.invalidValue;
      }
    }
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result as InternalValidationErrorResult;

      if (shouldStopOnFirstError) {
        return errorResult!;
      }
    }
  }

  return errorResult !== undefined
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      { ...errorResult, invalidValue: outValue !== undefined ? () => outValue : outInvalidValue! }
    : makeNoError(outValue);
};

class AllOfSchemaImpl<TypeA, TypeB> extends InternalSchemaMakerImpl<TypeA & TypeB> implements AllOfSchema<TypeA, TypeB> {
  // Public Fields

  public readonly schemas: [Schema<TypeA>, Schema<TypeB>];

  // PureSchema Field Overrides

  public override readonly schemaType = 'allOf';

  public override readonly valueType = undefined as any as TypeA & TypeB;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = false;

  // Initialization

  constructor(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>) {
    super();

    this.schemas = [schemaA, schemaB];

    this.estimatedValidationTimeComplexity = schemaA.estimatedValidationTimeComplexity + schemaB.estimatedValidationTimeComplexity;
    this.usesCustomSerDes = schemaA.usesCustomSerDes || schemaB.usesCustomSerDes;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
      schemaA.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval || schemaB.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;
  }

  // Public Methods

  public readonly clone = (): AllOfSchema<TypeA, TypeB> =>
    copyMetaFields({ from: this, to: new AllOfSchemaImpl(this.schemas[0], this.schemas[1]) });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) =>
    validateAllOf(value, this, internalState, path, container, validationMode);

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (
    value,
    internalState,
    path,
    container,
    validationMode
  ) => validateAllOfAsync(value, this, internalState, path, container, validationMode);

  protected override overridableGetExtraToStringFields = () => ({
    schemas: this.schemas
  });
}
