import { schema } from './index';

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
