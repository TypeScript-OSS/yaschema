/**
 * Given a list of string literals and/or string subtype arrays, creates a typed, flattened array.
 *
 * For example:
 * ```
 * const x = makeStringSubtypeArray('one', 'two');
 * type X = typeof x[0];
 * const y = makeStringSubtypeArray(x, 'three');
 * type Y = typeof y[0];
 * ```
 *
 * In the above example:
 *
 * - the type of `x` is `Array<'one' | 'two'>`
 * - the type of `y` is `Array<'one' | 'two' | 'three'>`
 *
 * and so:
 *
 * - 'X' is `'one' | 'two'`
 * - 'Y' is `'one' | 'two' | 'three'`
 */
export const makeStringSubtypeArray = <T extends string>(...args: SingleOrArray<T>[]): StringSubtypeArray<T> => {
  const output = flatten(args) as StringSubtypeArray<T>;
  const set = new Set(output as string[]);

  output.checked = (value: string): T | undefined => (set.has(value) ? (value as T) : undefined);

  output.checkedArray = (...values: string[]): T[] => values.filter((v): v is T => set.has(v)) as T[];

  output.exclude = <ExcludeT extends T>(...excludeArgs: ExcludeT[]): StringSubtypeArray<Exclude<T, ExcludeT>> => {
    const excludeArgsSet = new Set<string>(excludeArgs);

    return makeStringSubtypeArray(output.filter((value) => !excludeArgsSet.has(value))) as StringSubtypeArray<Exclude<T, ExcludeT>>;
  };

  output.has = (value: string): value is T => set.has(value);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.freeze(output as any);
};

export type StringSubtypeArray<T extends string> = T[] & {
  /** If the specified value belongs to the array returns the value as the desired type */
  checked: (value: string) => T | undefined;
  /** Filters the specified values, returning only those in this array, in O(1) time per value */
  checkedArray: (...values: string[]) => T[];
  /** Creates a new enhanced array type without the specified options */
  exclude: <ExcludeT extends T>(...excludeArgs: ExcludeT[]) => StringSubtypeArray<Exclude<T, ExcludeT>>;
  /** Checks if the specified value belongs to the array in O(1) time  */
  has: (value: string) => boolean;
};

// Helpers

type SingleOrArray<T extends string> = T | T[];

const flatten = <T extends string>(args: SingleOrArray<T>[]): T[] => {
  const output: T[] = [];
  for (const arg of args) {
    if (Array.isArray(arg)) {
      output.push(...arg);
    } else if (typeof arg === 'string') {
      output.push(arg);
    }
  }

  return output;
};
