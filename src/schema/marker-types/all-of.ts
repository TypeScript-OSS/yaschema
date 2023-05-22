import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
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
import { isMoreSevereResult } from '../internal/utils/is-more-severe-result';

/** Requires all of the schemas be satisfied. */
export interface AllOfSchema<TypeA, TypeB> extends Schema<TypeA & TypeB> {
  schemaType: 'allOf';
  clone: () => AllOfSchema<TypeA, TypeB>;

  schemas: [Schema<TypeA>, Schema<TypeB>];
}

/**
 * Requires all of the schemas be satisfied.
 *
 * The base form takes 2 schemas, but `allOf3`, `allOf4`, and `allOf5` take more.  If you need even more than that, use something like
 * `allOf(allOf5(…), allOf5(…))`
 */
export const allOf = <TypeA, TypeB>(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>) => new AllOfSchemaImpl(schemaA, schemaB);

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
  {
    schema,
    path,
    validatorOptions
  }: {
    schema: AllOfSchema<TypeA, TypeB>;
    path: LazyPath;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError =
    validationMode === 'hard' || (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined = undefined;
  for (const subschema of schema.schemas) {
    const result = (subschema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult!;
      }
    }
  }

  return errorResult ?? {};
};

const validateAllOfAsync = async <TypeA, TypeB>(
  value: any,
  {
    schema,
    path,
    validatorOptions
  }: {
    schema: AllOfSchema<TypeA, TypeB>;
    path: LazyPath;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError =
    validationMode === 'hard' || (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();

  let errorResult: InternalValidationResult | undefined = undefined;
  for (const subschema of schema.schemas) {
    const result =
      subschema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (subschema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path)
        : (subschema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult!;
      }
    }
  }

  return errorResult ?? noError;
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

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateAllOf(value, {
      schema: this,
      path,
      validatorOptions
    });

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    validateAllOfAsync(value, {
      schema: this,
      path,
      validatorOptions
    });

  protected override overridableGetExtraToStringFields = () => ({
    schemas: this.schemas
  });
}
