// Don't export this type out of the package because type inference gets messed up

/** Picks the fields of an object type that are never undefined */
export type PickAlwaysDefinedValues<Base> = Pick<
  Base,
  {
    [Key in keyof Base]: Base[Key] extends Exclude<Base[Key], undefined> ? Key : never;
  }[keyof Base]
>;
