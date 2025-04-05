import type { AsyncCloner, SyncCloner } from '../../../types/cloner.js';
import type { AsyncDeserializer, SyncDeserializer } from '../../../types/deserializer';
import type { PureSchema } from '../../../types/pure-schema';
import type { Schema } from '../../../types/schema';
import type { SchemaFunctions } from '../../../types/schema-functions';
import type { SchemaPreferredValidationMode } from '../../../types/schema-preferred-validation';
import type { SchemaType } from '../../../types/schema-type';
import type { AsyncSerializer, SyncSerializer } from '../../../types/serializer';
import type { AsyncValidator, SyncValidator } from '../../../types/validator';
import { dynamicAllowNull, dynamicNot, dynamicOptional } from '../circular-support/funcs.js';
import type { InternalSchemaFunctions } from '../types/internal-schema-functions';
import type { InternalAsyncValidator } from '../types/internal-validation';
import { pickNextTopValidationMode } from '../utils/pick-next-top-validation-mode.js';
import { makeExternalAsyncCloner } from './make-external-async-cloner.js';
import { makeExternalAsyncDeserializer } from './make-external-async-deserializer.js';
import { makeExternalAsyncSerializer } from './make-external-async-serializer.js';
import { makeExternalAsyncValidator } from './make-external-async-validator.js';
import { makeExternalSyncCloner } from './make-external-sync-cloner.js';
import { makeExternalSyncDeserializer } from './make-external-sync-deserializer.js';
import { makeExternalSyncSerializer } from './make-external-sync-serializer.js';
import { makeExternalSyncValidator } from './make-external-sync-validator.js';

export abstract class InternalSchemaMakerImpl<ValueT> implements PureSchema<ValueT>, SchemaFunctions<ValueT>, InternalSchemaFunctions {
  /** A marker that can be used for testing if this is a YaSchema schema */
  public readonly isYaSchema = true as const;

  // CommonSchemaMeta Fields

  /** A description, which can be used by code generation tools to generate documentation */
  public description?: string;

  /** An example, which can be used by code generation tools to generate documentation */
  public example?: string;

  /**
   * The preferred validation mode for this schema.
   *
   * The lesser level of the preferred validation mode, which will be applied recursively depending on the `depth` parameter / unless
   * further re-specified, and the specified validation mode, will be used, where the order is `none < soft < hard`.
   *
   * Special Values:
   * - `"initial"` - use the initially specified validation mode for the current operation (ex. the `validation` field of the `options`
   * parameter to `deserialize`).
   * - `"inherit"` - use the closet applicable mode from an ancestor schema level.
   */
  public preferredValidationMode: SchemaPreferredValidationMode = 'inherit';

  // Abstract PureSchema Fields

  /** The type of schema */
  public abstract readonly schemaType: SchemaType;

  /** The actual value of this field is always `undefined`, but this should be used for determining the value type represented by this
   * schema, ex. `typeof someSchema.valueType` */
  public abstract readonly valueType: ValueT;

  /** An estimate of the time complexity for validating this element, which should be on the same order of the number of items to be
   * validated */
  public abstract readonly estimatedValidationTimeComplexity: number;

  /** If `true`, this schema or any sub-elements have the potential to represent an object value that might need unknown-key removal */
  public abstract readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  /** If `true`, this schema or any sub-elements have a custom serializer-deserializer */
  public abstract readonly usesCustomSerDes: boolean;

  /** If `true`, `"shallow"` ancestor validation mode preferences won't be used when this schemas validation mode preference is
   * `"inherit"`, like other built-in container types */
  public abstract readonly isContainerType: boolean;

  // Abstract Methods

  /** Validates and potentially transforms the specified value.  If `undefined`, `internalValidate` is used */
  protected abstract overridableInternalValidateAsync: InternalAsyncValidator;

  /** The fields from PureSchema are already included in `toString`, this method allows subclasses to add additional fields to the
   * `toString` output, which is just a JSON stringified object */
  protected abstract overridableGetExtraToStringFields?: () => Record<string, any>;

  // InternalSchemaFunctions

  /** Validates and potentially transforms the specified value.  If not provided, internalValidate is used */
  public readonly internalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) =>
    internalState.relaxIfNeeded(() => {
      const nextValidationMode = pickNextTopValidationMode(this.preferredValidationMode, internalState.operationValidation, validationMode);

      return this.overridableInternalValidateAsync(value, internalState, path, container, nextValidationMode);
    });

  // SchemaFunctions

  /** Returns a new schema that requires that either this schema is satisfied or that the value is `null`. */
  public readonly allowNull = (): Schema<ValueT | null> => dynamicAllowNull(this);

  /** Returns a new schema that requires that this schema is satisfied but that the specified schema cannot be satisfied. */
  public readonly not = <ExcludeT>(
    notSchema: Schema<ExcludeT>,
    options?: { expectedTypeName?: string }
  ): Schema<Exclude<ValueT, ExcludeT>> => dynamicNot(this, notSchema, options);

  /** Returns a new schema that requires that either this schema is satisfied or that the value is `undefined`. */
  public readonly optional = (): Schema<ValueT | undefined> => dynamicOptional(this);

  /** Sets (replaces) the description metadata for this schema and returns the same schema */
  public readonly setDescription = (description?: string): this => {
    this.description = description;
    return this;
  };

  /** Sets (replaces) the example metadata for this schema and returns the same schema */
  public readonly setExample = (example?: string): this => {
    this.example = example;
    return this;
  };

  /**
   * Sets (replaces) the preferred validation mode for this schema and returns the same schema.
   *
   * The lesser level of the preferred validation mode, which will be applied recursively depending on the `depth` parameter / unless
   * further re-specified, and the specified validation mode, will be used, where the order is `none < soft < hard`.
   *
   * @param validationMode - The preferred validation mode for this schema
   * Special Values:
   * - `"initial"` - use the initially specified validation mode for the current operation (ex. the `validation` field of the `options`
   * parameter to `deserialize`).
   * - `"inherit"` - (default) use the closet applicable mode from an ancestor schema level.
   */
  public readonly setPreferredValidationMode = (validationMode: SchemaPreferredValidationMode): this => {
    this.preferredValidationMode = validationMode;
    return this;
  };

  /** Makes a string representation of this schema, mostly for debugging */
  public readonly toString = (): string =>
    JSON.stringify(
      {
        schemaType: this.schemaType,
        valueType: this.valueType,
        estimatedValidationTimeComplexity: this.estimatedValidationTimeComplexity,
        isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
        usesCustomSerDes: this.usesCustomSerDes,
        isContainerType: this.isContainerType,
        description: this.description,
        example: this.example,
        preferredValidationMode: this.preferredValidationMode,
        ...this.overridableGetExtraToStringFields?.()
      },
      undefined,
      2
    );

  /** Deeply clones a value */
  public readonly cloneValueAsync: AsyncCloner<ValueT> = makeExternalAsyncCloner<ValueT>(this.internalValidateAsync);

  /** Deeply clones a value.  This throws if the schema requires async cloning. */
  public readonly cloneValue: SyncCloner<ValueT> = makeExternalSyncCloner<ValueT>(this.cloneValueAsync);

  /** Deserialize (and validate) a value */
  public readonly deserializeAsync: AsyncDeserializer<ValueT> = makeExternalAsyncDeserializer<ValueT>(this.internalValidateAsync);

  /** Deserialize (and validate) a value.  This throws if the schema requires async deserialization. */
  public readonly deserialize: SyncDeserializer<ValueT> = makeExternalSyncDeserializer<ValueT>(this.deserializeAsync);

  /** Serialize (and validate) a value */
  public readonly serializeAsync: AsyncSerializer<ValueT> = makeExternalAsyncSerializer<ValueT>(this.internalValidateAsync);

  /** Serialize (and validate) a value.  This throws if the schema requires async serialization. */
  public readonly serialize: SyncSerializer<ValueT> = makeExternalSyncSerializer<ValueT>(this.serializeAsync);

  /** Validate a value */
  public readonly validateAsync: AsyncValidator = makeExternalAsyncValidator(this.internalValidateAsync);

  /** Validate a value.  This throws if the schema requires async validation. */
  public readonly validate: SyncValidator = makeExternalSyncValidator(this.validateAsync);
}
