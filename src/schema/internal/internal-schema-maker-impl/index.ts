import type { CommonSchemaMeta, PureSchema } from '../../../types/pure-schema';
import type { Schema } from '../../../types/schema';
import type { SchemaPreferredValidationMode, SchemaPreferredValidationModeDepth } from '../../../types/schema-preferred-validation';
import { allowNull } from '../../marker-types/allow-null';
import { not } from '../../marker-types/not';
import { optional } from '../../marker-types/optional';
import { InternalSchema, InternalSchemaMakerArgs, setInternalSchemaMaker } from '../internal-schema-maker';
import type { InternalAsyncValidator, InternalValidator } from '../types/internal-validation';
import { isContainerType } from '../utils/is-container-type';
import { makeExternalAsyncDeserializer } from './make-external-async-deserializer';
import { makeExternalAsyncSerializer } from './make-external-async-serializer';
import { makeExternalAsyncValidator } from './make-external-async-validator';
import { makeExternalDeserializer } from './make-external-deserializer';
import { makeExternalSerializer } from './make-external-serializer';
import { makeExternalValidator } from './make-external-validator';

// Registers the internal schema maker function, which takes a pure schema and core validation functions, and generates the public interface
// and special internal access
setInternalSchemaMaker(
  <ValueT, IncompletePureSchemaT extends Omit<PureSchema<ValueT>, keyof CommonSchemaMeta>>(
    pureSchema: Omit<IncompletePureSchemaT, keyof CommonSchemaMeta>,
    args: InternalSchemaMakerArgs
  ): InternalSchema<ValueT, IncompletePureSchemaT & CommonSchemaMeta> => {
    const internalValidate: InternalValidator = (value, validatorOptions, path) => {
      if (validatorOptions.shouldRemoveUnknownKeys && fullSchema.disableRemoveUnknownKeys) {
        validatorOptions.inoutUnknownKeysByPath[path] = 'allow-all';
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const isAContainer = isContainerType(pureSchema as any);
      const shouldPushValidationPreferences = isAContainer || fullSchema.preferredValidationMode !== 'inherit';
      if (shouldPushValidationPreferences) {
        validatorOptions.schemaValidationPreferences.push({
          mode: fullSchema.preferredValidationMode,
          depth: fullSchema.preferredValidationModeDepth,
          isContainerType: isAContainer
        });
      }
      try {
        return args.internalValidate(value, validatorOptions, path);
      } finally {
        if (shouldPushValidationPreferences) {
          validatorOptions.schemaValidationPreferences.pop();
        }
      }
    };
    const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
      if (validatorOptions.shouldYield()) {
        await validatorOptions.yield();
      }

      if (validatorOptions.shouldRemoveUnknownKeys && fullSchema.disableRemoveUnknownKeys) {
        validatorOptions.inoutUnknownKeysByPath[path] = 'allow-all';
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const isAContainer = isContainerType(pureSchema as any);
      const shouldPushValidationPreferences = isAContainer || fullSchema.preferredValidationMode !== 'inherit';
      if (shouldPushValidationPreferences) {
        validatorOptions.schemaValidationPreferences.push({
          mode: fullSchema.preferredValidationMode,
          depth: fullSchema.preferredValidationModeDepth,
          isContainerType: isAContainer
        });
      }
      try {
        return await (args.internalValidateAsync ?? internalValidate)(value, validatorOptions, path);
      } finally {
        if (shouldPushValidationPreferences) {
          validatorOptions.schemaValidationPreferences.pop();
        }
      }
    };

    const fullSchema: InternalSchema<ValueT, IncompletePureSchemaT & CommonSchemaMeta> = {
      ...pureSchema,
      description: undefined,
      example: undefined,
      disableRemoveUnknownKeys: false,
      preferredValidationMode: 'inherit',
      preferredValidationModeDepth: 'shallow',
      // InternalSchemaFunctions
      internalValidate,
      internalValidateAsync,
      // Marker
      isYaSchema: true,
      // SchemaFunctions
      allowNull: () => allowNull(fullSchema),
      not: <ExcludeT>(notSchema: Schema<Exclude<ValueT, ExcludeT>>, options: { expectedTypeName?: string } = {}) =>
        not(fullSchema, notSchema, options),
      optional: () => optional(fullSchema),
      setDescription: (description?: string) => {
        fullSchema.description = description;
        return fullSchema;
      },
      setExample: (example?: string) => {
        fullSchema.example = example;
        return fullSchema;
      },
      setDisableRemoveUnknownKeys: (disable: boolean) => {
        fullSchema.disableRemoveUnknownKeys = disable;
        return fullSchema;
      },
      setPreferredValidationMode: (validationMode: SchemaPreferredValidationMode, depth: SchemaPreferredValidationModeDepth) => {
        fullSchema.preferredValidationMode = validationMode;
        fullSchema.preferredValidationModeDepth = depth;
        return fullSchema;
      },
      toString: () => JSON.stringify(pureSchema, undefined, 2),
      deserialize: makeExternalDeserializer<ValueT>(internalValidate),
      deserializeAsync: makeExternalAsyncDeserializer<ValueT>(internalValidateAsync),
      serialize: makeExternalSerializer<ValueT>(internalValidate),
      serializeAsync: makeExternalAsyncSerializer<ValueT>(internalValidateAsync),
      validate: makeExternalValidator(internalValidate),
      validateAsync: makeExternalAsyncValidator(internalValidateAsync)
    } as any as InternalSchema<ValueT, IncompletePureSchemaT & CommonSchemaMeta>;

    return fullSchema;
  }
);
