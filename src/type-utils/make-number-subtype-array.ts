/**
 * Given a list of number literals and/or number subtype arrays, creates a typed, flattened array.
 *
 * For example:
 * ```
 * const x = makeNumberSubtypeArray(1, 2);
 * type X = typeof x[0];
 * const y = makeNumberSubtypeArray(x, 3);
 * type Y = typeof y[0];
 * ```
 *
 * In the above example:
 *
 * - the type of `x` is `Array<1 | 2>`
 * - the type of `y` is `Array<1 | 2 | 3>`
 *
 * and so:
 *
 * - 'X' is `1 | 2`
 * - 'Y' is `1 | 2 | 3`
 */
export const makeNumberSubtypeArray = <T extends number>(...args: SingleOrArray<T>[]): NumberSubtypeArray<T> => {
  const output = flatten(args) as NumberSubtypeArray<T>;
  const set = new Set(output as number[]);

  output.checked = (value: number): T | undefined => (set.has(value) ? (value as T) : undefined);

  output.checkedArray = (...values: number[]): T[] => values.filter((v): v is T => set.has(v)) as T[];

  output.exclude = <ExcludeT extends T>(...excludeArgs: ExcludeT[]): NumberSubtypeArray<Exclude<T, ExcludeT>> => {
    const excludeArgsSet = new Set<number>(excludeArgs);

    return makeNumberSubtypeArray(output.filter((value) => !excludeArgsSet.has(value))) as NumberSubtypeArray<Exclude<T, ExcludeT>>;
  };

  output.has = (value: number): value is T => set.has(value);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.freeze(output as any);
};

export type NumberSubtypeArray<T extends number> = T[] & {
  /** If the specified value belongs to the array returns the value as the desired type */
  checked: (value: number) => T | undefined;
  /** Filters the specified values, returning only those in this array, in O(1) time per value */
  checkedArray: (...values: number[]) => T[];
  /** Creates a new enhanced array type without the specified options */
  exclude: <ExcludeT extends T>(...excludeArgs: ExcludeT[]) => NumberSubtypeArray<Exclude<T, ExcludeT>>;
  /** Checks if the specified value belongs to the array in O(1) time  */
  has: (value: number) => boolean;
};

// Helpers

type SingleOrArray<T extends number> = T | T[];

const flatten = <T extends number>(args: SingleOrArray<T>[]): T[] => {
  const output: T[] = [];
  for (const arg of args) {
    if (Array.isArray(arg)) {
      output.push(...arg);
    } else if (typeof arg === 'number') {
      output.push(arg);
    }
  }

  return output;
};
