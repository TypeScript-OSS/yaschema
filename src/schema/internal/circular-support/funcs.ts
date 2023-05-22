import type { Schema } from '../../../types/schema';

export type AllowNullFunc = <ValueT>(schema: Schema<ValueT>) => Schema<ValueT | null>;
export type NotFunc = <ValueT, ExcludedT>(
  schema: Schema<ValueT>,
  exclude: Schema<ExcludedT>,
  options?: { expectedTypeName?: string }
) => Schema<Exclude<ValueT, ExcludedT>>;
export type OptionalFunc = <ValueT>(schema: Schema<ValueT>) => Schema<ValueT | undefined>;

// InternalSchemaMakerImpl circularly depends on AllowNull, Not, and Optional, for convenience functions, so we have to initialize these
// lazily

export let dynamicAllowNull: AllowNullFunc;

export const setDynamicAllowNull = (func: AllowNullFunc) => {
  dynamicAllowNull = func;
};

export let dynamicNot: NotFunc;

export const setDynamicNot = (func: NotFunc) => {
  dynamicNot = func;
};

export let dynamicOptional: OptionalFunc;

export const setDynamicOptional = (func: OptionalFunc) => {
  dynamicOptional = func;
};
