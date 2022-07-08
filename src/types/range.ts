/** A generic range */
export interface Range<T> {
  /**
   * The minimum allowed value
   *
   * @see `minExclusive`
   *
   * @defaultValue no minimum
   */
  min?: T;

  /**
   * If `true`, the minimum value is exclusive (meaning values `>`, rather than `>=` are included)
   *
   * @defaultValue `false`
   */
  minExclusive?: boolean;

  /**
   * The maximum allowed value.
   *
   * @see `maxExclusive`
   *
   * @defaultValue no maximum
   */
  max?: T;

  /**
   * If `true`, the maximum value is exclusive (meaning values `<`, rather than `<=` are included)
   *
   * @defaultValue `false`
   */
  maxExclusive?: boolean;
}
