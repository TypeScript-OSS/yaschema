import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import type { Schema } from '../../../types/schema';
import type { ValidationMode } from '../../../types/validation-options';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalState } from '../../internal/internal-schema-maker-impl/internal-state';
import type { GenericContainer } from '../../internal/types/generic-container';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type {
  InternalAsyncValidator,
  InternalValidationErrorResult,
  InternalValidationResult
} from '../../internal/types/internal-validation';
import type { LazyPath } from '../../internal/types/lazy-path';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { isErrorResult } from '../../internal/utils/is-error-result.js';
import { isMoreSevereResult } from '../../internal/utils/is-more-severe-result.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeClonedValueNoError, makeNoError } from '../../internal/utils/make-no-error.js';
import { appendPathIndex } from '../../internal/utils/path-utils.js';
import type { TupleSchema } from '../types/TupleSchema';

/** Requires a value where items must positionally match the specified schemas */
export const tuple = <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>(args: {
  items:
    | []
    | [Schema<TypeA>]
    | [Schema<TypeA>, Schema<TypeB>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
}): TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE> => new TupleSchemaImpl(args);

// Helpers

/** Requires an array, with items matching the specified schema */
const validateTupleAsync = async <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>(
  value: any,
  {
    schema,
    internalState
  }: {
    schema: TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE>;
    internalState: InternalState;
  },
  path: LazyPath,
  container: GenericContainer,
  validationMode: ValidationMode
): Promise<InternalValidationResult> => {
  const shouldStopOnFirstError =
    validationMode === 'hard' ||
    (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && internalState.transformation === 'none');

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected array, found ${getMeaningfulTypeof(value)}`,
      path
    );
  }

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return makeClonedValueNoError(value);
  }

  let errorResult: InternalValidationErrorResult | undefined;

  if (errorResult === undefined && value.length !== schema.items.length) {
    errorResult = makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected an array with ${schema.items.length} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (!Array.isArray(container)) {
    container = [];
  }

  const numItems = schema.items.length;
  for (let index = 0; index < numItems; index += 1) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arrayItem = value[index];

    const item = schema.items[index];
    const result = await (item as any as InternalSchemaFunctions).internalValidateAsync(
      arrayItem,
      internalState,
      appendPathIndex(path, index),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      container[index] ?? {},
      validationMode
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    container[index] = isErrorResult(result) ? (container[index] ?? result.invalidValue()) : result.value;
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result as InternalValidationErrorResult;

      if (shouldStopOnFirstError) {
        return errorResult;
      }
    }
  }

  return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
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
      (items[0]?.usesCustomSerDes ?? false) ||
      (items[1]?.usesCustomSerDes ?? false) ||
      (items[2]?.usesCustomSerDes ?? false) ||
      (items[3]?.usesCustomSerDes ?? false) ||
      (items[4]?.usesCustomSerDes ?? false);
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
      (items[0]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ?? false) ||
      (items[1]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ?? false) ||
      (items[2]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ?? false) ||
      (items[3]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ?? false) ||
      (items[4]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ?? false);
  }

  // Public Methods

  public readonly clone = (): TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE> =>
    copyMetaFields({ from: this, to: tuple({ items: this.items }) });

  // Method Overrides

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (
    value,
    internalState,
    path,
    container,
    validationMode
  ) => validateTupleAsync(value, { schema: this, internalState }, path, container, validationMode);

  protected override overridableGetExtraToStringFields = () => ({
    items: this.items
  });
}
