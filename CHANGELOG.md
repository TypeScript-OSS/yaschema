# Changelog

## [2.0.3] - 2023-03-16

- Pointing to new home at TypeScript OSS.

## [2.0.2] - 2023-01-23

- Now including src folder into npm package so source maps can resolve properly.

## [2.0.1] - 2023-01-11

- Updated codebase to TypeScript 4.9.

## [2.0.0-alpha.x] - 2022-09-02

### Added

_See notes below for more details on each._

- Support for per-schema and hierarchical, validation mode preferences (overrides).
- `errorLevel` and `errorPath` fields on validation, serialization, and deserialization results that had errors.
- Support for options to remove unknown keys.

### Notes

#### Validation

- `Schema.setPreferredValidationMode` allows you to adjust the validation mode for a single level or recursively.
- The validation mode chosen for a schema will always be the lower of that specified at the operation level and `setPreferredValidationMode`, where the order is `none < soft < hard`.
- A new `errorLevel` field is now returned with validation, serialization, and deserialization results, when an error occurs.  This can be `"error"` or `"warning"` where `"error"` represents a "hard" failure and `"warning"` represents a "soft" failure (ex. that should be logged but is ok to work with).
- A new `errorPath` field is now also returned with validation, serialization, and deserialization results, when an error occurs.  The error path is still also included in the error message string, but the separate value may be more convenient in some cases.

#### Unknown Key Removal

- See new `removeUnknownKeys` (`false` by default) option on serialization and deserialization functions.  See also `Schema.setDisableRemoveUnknownKeys`, which allows one to disable the removal of unknown keys, even when `removeUnknownKeys` is `true`, for values represented by specific schemas.

---

## [1.5.0] - 2022-08-25

### Added

- `schema.pick` and `schema.omit` which operate, like `schema.partial`, on `ObjectSchemas` to reduce the number of considered keys in an object schema.

## [1.4.2] - 2022-08-22

### Changed

- Date strings can now be deserialized using 1-9 sub-second digits, if sub-seconds are specified.

## [1.4.1] - 2022-08-09

### Fixed

- An issue where async validation of `schema.oneOf` in `"none"` validation mode with child elements that needed custom ser-des would short-circuit incorrectly causing the custom ser-des to be skipped.

## [1.4.0] - 2022-08-08

### Added

- All schema types, except 'root', now have a `clone` function.

### Removed

- Distinct 'partial' schema type, since `schema.partial` just generates a new object schema type with each field marked as optional.

## [1.3.1] - 2022-08-08

### Changed

- The arguments to `Schema.setDescription` and `Schema.setExample` are now optional, so they can be used to clear a previously set description or example, respectively.

## [1.3.0] - 2022-08-06

### Added

- For `schema.boolean`, `schema.number`, and `schema.restrictedNumber`, added `allowedSerializationForms` metadata and a `setAllowedSerializationForms` function to set (replace) that metadata.  These allow for boolean or numeric types that serialize as string or string/boolean (ex. for use in query params).

### Removed

- The `CommonSchemaOptions` type and the ability to directly pass those options (i.e. description and example) during initial schema creation, because it was very inconsistent.

## [1.2.1] - 2022-08-04

### Added

- Missing metadata (`expectedTypeName` on `NotSchema` and `uniqueName` on `UpgradedSchema`)

## [1.2.0] - 2022-08-03

### Changed

- How `schema.partial` works.  It now uses `schema.object` more directly, resulting in better type inference.

### Removed

- `ObjectSchema.partial()`

## [1.1.1] - 2022-08-03

### Removed

- Exported type `InferRecordOfSchemasFromRecordOfValues`, which was causing TypeScript to erase important type information.

## [1.1.0] - 2022-08-03

### Changed

- Changed `SchemaType` `'restricted-number'` to `'restrictedNumber'` for better consistency with other multi-word type IDs.

### Fixed

- An issue with indirectly optional object and string schemas where extra values and functions (ex. map) were excluded in optional version of schema.

## [1.0.1] - 2022-08-03

### Removed

- Exported types `TreatUndefinedAsOptional`, `PickPossiblyUndefinedValues`, and `PickAlwaysDefinedValues`, which were causing TypeScript to erase important type information.

## [1.0.0] - 2022-08-02

- Initial official public release.
