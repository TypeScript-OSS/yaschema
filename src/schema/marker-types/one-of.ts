import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type {
  InternalAsyncValidator,
  InternalValidationOptions,
  InternalValidationResult,
  InternalValidator
} from '../internal/types/internal-validation';
import type { LazyPath } from '../internal/types/lazy-path';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';

/** Requires at least one of the schemas be satisfied. */
export interface OneOfSchema<TypeA, TypeB> extends Schema<TypeA | TypeB> {
  schemaType: 'oneOf';
  clone: () => OneOfSchema<TypeA, TypeB>;

  schemas: [Schema<TypeA>, Schema<TypeB>];
}

/**
 * Requires at least one of the schemas be satisfied.
 *
 * The base form takes 2 schemas, but `oneOf3`, `oneOf4`, and `oneOf5` take more.  If you need even more than that, use something like
 * `oneOf(oneOf5(…), oneOf5(…))`
 */
export const oneOf = <TypeA, TypeB>(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>) => new OneOfSchemaImpl(schemaA, schemaB);

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
const validateOneOf = <TypeA, TypeB>(
  value: any,
  {
    schema,
    path,
    validatorOptions
  }: {
    schema: OneOfSchema<TypeA, TypeB>;
    path: LazyPath;
    validatorOptions: InternalValidationOptions;
  }
): InternalValidationResult => {
  const validationMode = getValidationMode(validatorOptions);
  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  const validationResults: InternalValidationResult[] = [];

  let success = false;
  for (const subschema of schema.schemas) {
    const result = (subschema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (!isErrorResult(result)) {
      success = true;

      if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval) {
        return noError;
      }
    } else {
      validationResults.push(result);
    }
  }

  return success
    ? noError
    : makeErrorResultForValidationMode(
        validationMode,
        () => `Expected one of: ${validationResults.map((r) => r.error?.() ?? '').join(' or ')}, found ${getMeaningfulTypeof(value)}`,
        path
      );
};

/** Requires one of the specified schemas to be satisfied */
const validateOneOfAsync = async <TypeA, TypeB>(
  value: any,
  {
    schema,
    path,
    validatorOptions
  }: {
    schema: OneOfSchema<TypeA, TypeB>;
    path: LazyPath;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const validationMode = getValidationMode(validatorOptions);
  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();

  const validationResults: InternalValidationResult[] = [];

  let success = false;
  for (const subschema of schema.schemas) {
    const result =
      subschema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (subschema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path)
        : (subschema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (!isErrorResult(result)) {
      success = true;

      if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval) {
        return noError;
      }
    } else {
      validationResults.push(result);
    }
  }

  return success
    ? noError
    : makeErrorResultForValidationMode(
        validationMode,
        () => `Expected one of: ${validationResults.map((r) => r.error?.() ?? '').join(' or ')}, found ${getMeaningfulTypeof(value)}`,
        path
      );
};

class OneOfSchemaImpl<TypeA, TypeB> extends InternalSchemaMakerImpl<TypeA | TypeB> implements OneOfSchema<TypeA, TypeB> {
  // Public Fields

  public readonly schemas: [Schema<TypeA>, Schema<TypeB>];

  // PureSchema Field Overrides

  public override readonly schemaType = 'oneOf';

  public override readonly valueType = undefined as any as TypeA | TypeB;

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

  public readonly clone = (): OneOfSchema<TypeA, TypeB> =>
    copyMetaFields({ from: this, to: new OneOfSchemaImpl(this.schemas[0], this.schemas[1]) });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateOneOf(value, {
      schema: this,
      path,
      validatorOptions
    });

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    validateOneOfAsync(value, {
      schema: this,
      path,
      validatorOptions
    });

  protected override overridableGetExtraToStringFields = () => ({
    schemas: this.schemas
  });
}
