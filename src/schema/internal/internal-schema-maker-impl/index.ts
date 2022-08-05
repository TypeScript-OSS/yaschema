import type { PureSchema } from '../../../types/pure-schema';
import type { Schema } from '../../../types/schema';
import { allowNull } from '../../marker-types/allow-null';
import { not } from '../../marker-types/not';
import { optional } from '../../marker-types/optional';
import { InternalSchema, InternalSchemaMakerArgs, setInternalSchemaMaker } from '../internal-schema-maker';
import { InternalAsyncValidator } from '../types/internal-validation';
import { makeExternalAsyncDeserializer } from './make-external-async-deserializer';
import { makeExternalAsyncSerializer } from './make-external-async-serializer';
import { makeExternalAsyncValidator } from './make-external-async-validator';
import { makeExternalDeserializer } from './make-external-deserializer';
import { makeExternalSerializer } from './make-external-serializer';
import { makeExternalValidator } from './make-external-validator';

// Registers the internal schema maker function, which takes a pure schema and core validation functions, and generates the public interface
// and special internal access
setInternalSchemaMaker(
  <ValueT, PureSchemaT extends PureSchema<ValueT>>(
    pureSchema: PureSchemaT,
    args: InternalSchemaMakerArgs
  ): InternalSchema<ValueT, PureSchemaT> => {
    const internalValidate = args.internalValidate;
    const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
      if (validatorOptions.shouldYield()) {
        await validatorOptions.yield();
      }

      return (args.internalValidateAsync ?? internalValidate)(value, validatorOptions, path);
    };

    const fullSchema: InternalSchema<ValueT, PureSchemaT> = {
      ...pureSchema,
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
      toString: () => JSON.stringify(pureSchema, undefined, 2),
      deserialize: makeExternalDeserializer<ValueT>(internalValidate),
      deserializeAsync: makeExternalAsyncDeserializer<ValueT>(internalValidateAsync),
      serialize: makeExternalSerializer<ValueT>(internalValidate),
      serializeAsync: makeExternalAsyncSerializer<ValueT>(internalValidateAsync),
      validate: makeExternalValidator(internalValidate),
      validateAsync: makeExternalAsyncValidator(internalValidateAsync)
    } as any as InternalSchema<ValueT, PureSchemaT>;

    return fullSchema;
  }
);
