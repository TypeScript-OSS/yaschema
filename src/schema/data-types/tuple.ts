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
import { isMoreSevereResult } from '../internal/utils/is-more-severe-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { appendPathIndex } from '../internal/utils/path-utils';

/** Requires a value where items must positionally match the specified schemas */
export interface TupleSchema<TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>
  extends Schema<
    TypeA extends void
      ? []
      : TypeB extends void
      ? [TypeA]
      : TypeC extends void
      ? [TypeA, TypeB]
      : TypeD extends void
      ? [TypeA, TypeB, TypeC]
      : TypeE extends void
      ? [TypeA, TypeB, TypeC, TypeD]
      : [TypeA, TypeB, TypeC, TypeD, TypeE]
  > {
  schemaType: 'tuple';
  clone: () => TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE>;

  items:
    | []
    | [Schema<TypeA>]
    | [Schema<TypeA>, Schema<TypeB>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
}

/** Requires a value where items must positionally match the specified schemas */
export const tuple = <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>(args: {
  items:
    | []
    | [Schema<TypeA>]
    | [Schema<TypeA>, Schema<TypeB>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
}) => new TupleSchemaImpl(args);

// Helpers

/** Requires an array, with items matching the specified schema */
const validateTuple = <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>(
  value: any,
  {
    schema,
    path,
    validatorOptions
  }: {
    schema: TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE>;
    path: LazyPath;
    validatorOptions: InternalValidationOptions;
  }
): InternalValidationResult => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError =
    validationMode === 'hard' || (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(validationMode, () => `Expected array, found ${getMeaningfulTypeof(value)}`, path);
  }

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined;

  if (errorResult === undefined && value.length !== schema.items.length) {
    errorResult = makeErrorResultForValidationMode(
      validationMode,
      () => `Expected an array with ${schema.items.length} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  const numItems = schema.items.length;
  for (let index = 0; index < numItems; index += 1) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arrayItem = value[index];

    const result = (schema.items[index] as any as InternalSchemaFunctions).internalValidate(
      arrayItem,
      validatorOptions,
      appendPathIndex(path, index)
    );
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult;
      }
    }
  }

  return errorResult ?? noError;
};

/** Requires an array, with items matching the specified schema */
const validateTupleAsync = async <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>(
  value: any,
  {
    schema,
    path,
    validatorOptions
  }: {
    schema: TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE>;
    path: LazyPath;
    validatorOptions: InternalValidationOptions;
  }
): Promise<InternalValidationResult> => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError =
    validationMode === 'hard' || (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(validationMode, () => `Expected array, found ${getMeaningfulTypeof(value)}`, path);
  }

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined;

  if (errorResult === undefined && value.length !== schema.items.length) {
    errorResult = makeErrorResultForValidationMode(
      validationMode,
      () => `Expected an array with ${schema.items.length} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
  const numItems = schema.items.length;
  for (let index = 0; index < numItems; index += 1) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arrayItem = value[index];

    const item = schema.items[index];
    const result =
      item.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (item as any as InternalSchemaFunctions).internalValidateAsync(arrayItem, validatorOptions, appendPathIndex(path, index))
        : (item as any as InternalSchemaFunctions).internalValidate(arrayItem, validatorOptions, appendPathIndex(path, index));
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult;
      }
    }
  }

  return errorResult ?? noError;
};

class TupleSchemaImpl<TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>
  extends InternalSchemaMakerImpl<
    TypeA extends void
      ? []
      : TypeB extends void
      ? [TypeA]
      : TypeC extends void
      ? [TypeA, TypeB]
      : TypeD extends void
      ? [TypeA, TypeB, TypeC]
      : TypeE extends void
      ? [TypeA, TypeB, TypeC, TypeD]
      : [TypeA, TypeB, TypeC, TypeD, TypeE]
  >
  implements TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE>
{
  // Public Fields

  public readonly items:
    | []
    | [Schema<TypeA>]
    | [Schema<TypeA>, Schema<TypeB>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];

  // PureSchema Field Overrides

  public override readonly schemaType = 'tuple';

  public override readonly valueType = undefined as any as TypeA extends void
    ? []
    : TypeB extends void
    ? [TypeA]
    : TypeC extends void
    ? [TypeA, TypeB]
    : TypeD extends void
    ? [TypeA, TypeB, TypeC]
    : TypeE extends void
    ? [TypeA, TypeB, TypeC, TypeD]
    : [TypeA, TypeB, TypeC, TypeD, TypeE];

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = true;

  // Initialization

  constructor({
    items
  }: {
    items:
      | []
      | [Schema<TypeA>]
      | [Schema<TypeA>, Schema<TypeB>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
  }) {
    super();

    this.items = items;

    this.estimatedValidationTimeComplexity =
      (items[0]?.estimatedValidationTimeComplexity ?? 0) +
      (items[1]?.estimatedValidationTimeComplexity ?? 0) +
      (items[2]?.estimatedValidationTimeComplexity ?? 0) +
      (items[3]?.estimatedValidationTimeComplexity ?? 0) +
      (items[4]?.estimatedValidationTimeComplexity ?? 0);
    this.usesCustomSerDes =
      (items[0]?.usesCustomSerDes ||
        items[1]?.usesCustomSerDes ||
        items[2]?.usesCustomSerDes ||
        items[3]?.usesCustomSerDes ||
        items[4]?.usesCustomSerDes) ??
      false;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
      (items[0]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ||
        items[1]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ||
        items[2]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ||
        items[3]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ||
        items[4]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval) ??
      false;
  }

  // Public Methods

  public readonly clone = (): TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE> =>
    copyMetaFields({ from: this, to: tuple({ items: this.items }) });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateTuple(value, {
      schema: this,
      path,
      validatorOptions
    });

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    validateTupleAsync(value, {
      schema: this,
      path,
      validatorOptions
    });

  protected override overridableGetExtraToStringFields = () => ({
    items: this.items
  });
}
