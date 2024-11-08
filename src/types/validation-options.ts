/**
 * - `'none'` - Do as little validation as possible and best-effort transformations
 * - `'soft'` - Keep going even after validation errors occur – use to keep best-effort transformations
 * - `'hard'` - If there are validation errors, stop immediately - transformations may be incomplete
 */
export type ValidationMode = 'none' | 'soft' | 'hard';

export interface ValidationOptions {
  /**
   * If `true`, synchronous validation is forced as much as possible.  There may be cases, with custom schemas, where this isn't possible,
   * and in such case a Promise will be returned, which one may which to check for -- using `is-promise`, for example.
   *
   * @defaultValue `false`
   */
  forceSync?: boolean;
  /**
   * The mode for validation.
   *
   * Individual schemas may lower the validation mode.
   *
   * @defaultValue `'hard'`
   */
  validation?: ValidationMode;
}
