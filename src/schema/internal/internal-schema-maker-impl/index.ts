import type { AsyncDeserializer, Deserializer } from '../../../types/deserializer';
import type { PureSchema } from '../../../types/pure-schema';
import type { Schema } from '../../../types/schema';
import type { SchemaFunctions } from '../../../types/schema-functions';
import type { SchemaPreferredValidationMode, SchemaPreferredValidationModeDepth } from '../../../types/schema-preferred-validation';
import type { SchemaType } from '../../../types/schema-type';
import type { AsyncSerializer, Serializer } from '../../../types/serializer';
import type { AsyncValidator, Validator } from '../../../types/validator';
import { dynamicAllowNull, dynamicNot, dynamicOptional } from '../circular-support/funcs';
import type { InternalSchemaFunctions } from '../types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../types/internal-validation';
import { makeExternalAsyncDeserializer } from './make-external-async-deserializer';
import { makeExternalAsyncSerializer } from './make-external-async-serializer';
import { makeExternalAsyncValidator } from './make-external-async-validator';
import { makeExternalDeserializer } from './make-external-deserializer';
import { makeExternalSerializer } from './make-external-serializer';
import { makeExternalValidator } from './make-external-validator';

export abstract class InternalSchemaMakerImpl<ValueT> implements PureSchema<ValueT>, SchemaFunctions<ValueT>, InternalSchemaFunctions {
  /** A marker that can be used for testing if this is a YaSchema schema */
  public readonly isYaSchema = true as const;

  // CommonSchemaMeta Fields

  /** A description, which can be used by code generation tools to generate documentation */
  public description?: string;

  /** An example, which can be used by code generation tools to generate documentation */
  public example?: string;

  /**
   * If `true`, extra keys don't cause errors and won't be removed, even if `failOnUnknownKeys` and/or `removeUnknownKeys` is `true` for the
   * operation.  This effects the directly described value but not sub-values.
   */
  public allowUnknownKeys = false;

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

  /**
   * The depth to apply schema-level validation preferences over.
   *
   * - `"shallow"` - The mode change only affects the validation of the value directly described by this schema.  For container types, this
   * includes the first level of fields but not deeper.
   * - `"deep"` - The mode change affects all values directly and indirectly described by this schema, unless the validation mode is
   * re-specified at a deeper level.
   */
  public preferredValidationModeDepth: SchemaPreferredValidationModeDepth = 'shallow';

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

  /** Synchronously validates and potentially transforms the specified value */
  protected abstract overridableInternalValidate: InternalValidator;

  /** Asynchronously validates and potentially transforms the specified value.  If `undefined`, `internalValidate` is used */
  protected abstract overridableInternalValidateAsync?: InternalAsyncValidator;

  /** The fields from PureSchema are already included in `toString`, this method allows subclasses to add additional fields to the
   * `toString` output, which is just a JSON stringified object */
  protected abstract overridableGetExtraToStringFields?: () => Record<string, any>;

  // InternalSchemaFunctions

  /** Synchronously validates and potentially transforms the specified value */
  public readonly internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (validatorOptions.shouldProcessUnknownKeys && this.allowUnknownKeys) {
      validatorOptions.setAllowAllKeysForPath(path);
    }

    const shouldPushValidationPreferences = this.isContainerType || this.preferredValidationMode !== 'inherit';
    if (shouldPushValidationPreferences) {
      validatorOptions.schemaValidationPreferences.push({
        mode: this.preferredValidationMode,
        depth: this.preferredValidationModeDepth,
        isContainerType: this.isContainerType
      });
    }
    try {
      return this.overridableInternalValidate(value, validatorOptions, path);
    } finally {
      if (shouldPushValidationPreferences) {
        validatorOptions.schemaValidationPreferences.pop();
      }
    }
  };

  /** Asynchronously validates and potentially transforms the specified value.  If not provided, internalValidate is used */
  public readonly internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    if (validatorOptions.shouldRelax()) {
      await validatorOptions.relax();
    }

    if (validatorOptions.shouldProcessUnknownKeys && this.allowUnknownKeys) {
      validatorOptions.setAllowAllKeysForPath(path);
    }

    const shouldPushValidationPreferences = this.isContainerType || this.preferredValidationMode !== 'inherit';
    if (shouldPushValidationPreferences) {
      validatorOptions.schemaValidationPreferences.push({
        mode: this.preferredValidationMode,
        depth: this.preferredValidationModeDepth,
        isContainerType: this.isContainerType
      });
    }
    try {
      return await (this.overridableInternalValidateAsync ?? this.overridableInternalValidate)(value, validatorOptions, path);
    } finally {
      if (shouldPushValidationPreferences) {
        validatorOptions.schemaValidationPreferences.pop();
      }
    }
  };

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

  /** Sets (replaces) the `allowUnknownKeys` option */
  public readonly setAllowUnknownKeys = (allow: boolean): this => {
    this.allowUnknownKeys = allow;
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
   * @param depth - The depth to apply schema-level validation preferences over
   * - `"shallow"` - (default) The mode change only affects the validation of the value directly described by this schema.  For container
   * types, this includes the first level of fields but not deeper.
   * - `"deep"` - The mode change affects all values directly and indirectly described by this schema, unless the validation mode is
   * re-specified at a deeper level.
   */
  public readonly setPreferredValidationMode = (
    validationMode?: SchemaPreferredValidationMode,
    depth?: SchemaPreferredValidationModeDepth
  ): this => {
    if (validationMode !== undefined) {
      this.preferredValidationMode = validationMode;
    }
    if (depth !== undefined) {
      this.preferredValidationModeDepth = depth;
    }
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
        allowUnknownKeys: this.allowUnknownKeys,
        preferredValidationMode: this.preferredValidationMode,
        preferredValidationModeDepth: this.preferredValidationModeDepth,
        ...this.overridableGetExtraToStringFields?.()
      },
      undefined,
      2
    );

  /** Synchronously deserialize (and validate) a value */
  public readonly deserialize: Deserializer<ValueT> = makeExternalDeserializer<ValueT>(this.internalValidate);

  /** Asynchronously deserialize (and validate) a value */
  public readonly deserializeAsync: AsyncDeserializer<ValueT> = makeExternalAsyncDeserializer<ValueT>(this.internalValidateAsync);

  /** Synchronously serialize (and validate) a value */
  public readonly serialize: Serializer<ValueT> = makeExternalSerializer<ValueT>(this.internalValidate);
  /** Asynchronously serialize (and validate) a value */
  public readonly serializeAsync: AsyncSerializer<ValueT> = makeExternalAsyncSerializer<ValueT>(this.internalValidateAsync);

  /** Synchronously validate a value */
  public readonly validate: Validator = makeExternalValidator(this.internalValidate);
  /** Asynchronously validate a value */
  public readonly validateAsync: AsyncValidator = makeExternalAsyncValidator(this.internalValidateAsync);
}
