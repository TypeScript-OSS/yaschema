# yaschema

[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]

Yet another schema.  Schema-first type modeling and validation for TypeScript.

We love TypeScript and use it pretty much everywhere.  We use it for our React Native app, our React web app, as well as for our server.

We built yaschema as part of our type and API spec system, to be TypeScript first -- and to still conveniently support code generation and OpenAPI spec generation as needed.

With yaschema, you can define both runtime and compile-time validated types with a single definition.

Schemas supports three main operations:

- `validate` / `validateAsync`  - validate without transforming
- `serialize` / `serializeAsync` - validate and transform to a JSON-compatible value
- `deserialize` / `deserializeAsync` - validate and transform from a JSON-compatible value

## Basic Example

[Try it Out – CodeSandbox](https://codesandbox.io/s/agitated-lucy-bxog45)

```typescript
import { schema } from 'yaschema';

// Defining an object schema with 3 string-array fields:
// - givenNames - requires at least 1 entry
// - middleNames - optional
// - familyNames - required but allows 0 entries
const personNameSchema = schema.object({
  givenNames: schema.array({ items: schema.string(), minLength: 1 }),
  middleNames: schema.array({ items: schema.string() }).optional(),
  familyNames: schema.array({ items: schema.string() })
});

// Defining an object schema with:
// - a date field
// - a field that uses our above-defined personNameSchema
// - an age field - a positive integer between 0 and 199, inclusive
const personalInfoSchema = schema.object({
  signupDate: schema.date(),
  name: personNameSchema,
  age: schema.restrictedNumber([{ min: 0, max: 200, maxExclusive: true }], { divisibleBy: [1] })
});
type PersonalInfo = typeof personalInfoSchema.valueType;

// Defining a const that compiles and satisfies the above schemas.
const personalInfo: PersonalInfo = {
  signupDate: new Date('2022-01-01'),
  name: {
    givenNames: ['John'],
    familyNames: ['Smith']
  },
  age: 25
};

// Checking if the data in personalInfo is valid according to personalInfoSchema
const validation = personalInfoSchema.validate(personalInfo);
if (validation.error !== undefined) {
  console.error('validation error', validation.error);
}

// Serializing, which converts into JSON-compatible values
const serialization = personalInfoSchema.serialize(personalInfo);
if (serialization.error !== undefined) {
  console.error('serialization error', serialization.error);
} else {
  console.log('serialized personalInfo', JSON.stringify(serialization.serialized, undefined, 2));
}

// Deserializing, which converts back into the original form
const deserialization = personalInfoSchema.deserialize(serialization.serialized);
if (deserialization.error !== undefined) {
  console.error('deserialization error', deserialization.error);
}
```

## Accessing Type Information

To access the type information at compile time, use `typeof` on the `valueType` field, available on any schema.  In the above example, we did:

```typescript
type PersonalInfo = typeof personalInfoSchema.valueType;
```

We could have also done something similar on `personNameSchema`, like `typeof personNameSchema.valueType`, though it wasn't needed in this case.  Sometimes it's convenient and/or more readable to make aliases for types from their schema value types, but it's not required.

The type of `typeof personNameSchema.valueType` is reduced to:

```typescript
interface PersonName {
  givenNames: string[];
  middleNames?: string[];
  familyNames: string[];
}
```

and for `typeof personalInfoSchema.valueType`, it's:

```typescript
interface PersonalInfo {
  signupDate: Date;
  name: PersonName;
  age: number;
}
```

Notice that the compile-time types are simpler and less restrictive than the schema types.  Some of the rules of some of the types are only checkable at runtime, because they depend on the specific values in the fields and because TypeScript (as most languages) doesn't have type expressions for some of these restrictions (ex. the divisibility of a number).

## Validation Modes

We tend to care most about precise schema-level validation:

- before persisting values
- after restoring previously-persisted values
- before transmitting to a client or server

In some cases, we want to allow but be aware of schema violations.  This is commonly the case while a user is editing a form, for example.  We want to save their work as they go, but to mark the incomplete or otherwise erroneous fields with indicators and feedback.  Similarly, in some environments, we might want to take a best-effort approach with certain data, especially from third-parties, logging schema violations, but continuing to function as best we can.

Yaschema supports three validation modes for serialization or deserialization:

- `'none'` - As little validation as possible is performed and serialization / deserialization are best effort.
- `'soft'` - Validation is performed but processing continues even if there are errors.  Serialization / deserialization are best effort.
- `'hard'` - If there are validation errors, serialization / deserialization are terminated.

## Built-In Data Types

### Basic Primitives

- `boolean` - any boolean, optionally restricted to a specific boolean value
- `date` - any date, optionally restricted by range
- `number` - any number, optionally restricted to a specific set of numbers
- `string` - any string, optionally restricted to a specific set of strings

### Enhanced Primitives

- `restrictedNumber` - any number, optionally restricted by values, ranges, and/or even divisors
- `regex` - any string matching the specified regular expression

### Collection Types

- `array` - an array with optionally validated items and length
- `tuple` - an array with positionally typed elements (0-5 elements per tuple)

### Strictured Types

- `object` - a non-null, non-array object with type information specified per key
- `record` - a non-null, non-array object with typed keys and values

### Catch All Types

- `any` - any non-null, non-undefined value

## Built-In Marker / Modifier Types

### Logical Modifier Types

- `allOf` - any value that satisfies all of the specified schemas
- `oneOf` - any value that satisfies at least one of the specified schemas
- `not` - any value that doesn't satisfy the specified schema

### Nullish Modifier Types

- `allowNull` - `null` or any value that satisfies the specified schema
- `optional` - `undefined` or any value that satisfies the specified schema

### Versioning Support Types

- `deprecated` - `undefined` or any value that satisfies the specified schema - where `undefined` is preferred and a message is logged otherwise
- `upgraded` - any where where either an old or new schema is satisfied - where the new schema is preferred and a message is logged if the old, but not new schema, is satisfied

### Special Marker Types

- `root` - any value that satisfies the specified schema - used as a special marker for creating named types, ex. with code generation tools

## Custom Types Example

It's easy to extend Yaschema with custom types.  In the following example, we demonstrate how to define:

- a serializer-deserializer - which is used for encoding and decoding [BigNumber](https://www.npmjs.com/package/bignumber.js) values to and from JSON
- a schema that names the custom type, uses the serializer-deserializer, and adds custom validation logic

```typescript
import BigNumber from 'bignumber.js';
import { makeSerDes, schema, ValidationResult } from 'yaschema';

// Defining the serializer-deserializer and a couple pre-requisite checking functions
const bigNumberSerDes = makeSerDes({
  // Converts from a JSON-compatible value to a BigNumber object
  deserialize: (value) => ({ deserialized: new BigNumber(value.bignumber) }),
  // Checks if the specified value is a BigNumber object.  This is called before serialization is attempted to avoid dealing with exceptions
  // and other error logic if this isn't the expected type (which will commonly happen when using oneOf, for example)
  isValueType: (value): value is BigNumber => BigNumber.isBigNumber(value),
  // Converts from a BigNumber object to a JSON-compatible value
  serialize: (value) => ({ serialized: { bignumber: value.toFixed() } }),
  // A schema that describes the serialized form, which we check before deserialization is attempted to avoid dealing with exceptions and
  // other error logic if this isn't the expected type (which will commonly happen when using oneOf, for example)
  serializedSchema: () => schema.object({ bignumber: schema.string() })
});

// Defining an extra validation step that checks if the BigNumber is NaN or infinite, since we don't want those kinds of numbers.
const validateBigNumber = (value: BigNumber): ValidationResult => {
  if (value.isNaN()) {
    return { error: 'Found NaN' };
  } else if (!value.isFinite()) {
    return { error: 'Found non-finite value' };
  }

  return {};
};

// Defining a custom schema
export const bigNumberSchema = schema.custom({
  typeName: 'BigNumber',
  serDes: bigNumberSerDes,
  customValidation: validateBigNumber
});
```

When working with custom schemas, it's important to make sure they don't ambiguously overlap with other types that you'll use together.  Notice in the above example that we serialize our values by encapsulating them in an object, like `{ bignumber: "3.14" }`.  If we had simply serialized the `BigNumber` as a string, then we'd have to be extra careful about using these schemas in places where also need plain strings.  For example, `schema.oneOf(bigNumberSchema, schema.string())` isn't very clear with respect to which type will be extracted.  When custom serializer-deserializers are used, the first one, in declaration order, to decode a value, wins.  While this is deterministic, it's not likely good design practice.

However, other strategies can be used as well.  For example, we could have used a string prefix and regular expression pattern matching, with an encoding like `"bignumber:3.14"`.  In fact, we encode `Date` object as ISO 8601 strings and rely on regular expression parsing.  Since ISO 8601 is such a precise format, it's easy to distinguish between date/time strings and other more arbitrary strings.

## Thanks

Thanks for checking it out.  Feel free to create issues or otherwise provide feedback.

[API Docs](https://typescript-oss.github.io/yaschema/)

Be sure to check out our other [TypeScript OSS](https://github.com/TypeScript-OSS) projects as well.

<!-- Definitions -->

[downloads-badge]: https://img.shields.io/npm/dm/yaschema.svg

[downloads]: https://www.npmjs.com/package/yaschema

[size-badge]: https://img.shields.io/bundlephobia/minzip/yaschema.svg

[size]: https://bundlephobia.com/result?p=yaschema
