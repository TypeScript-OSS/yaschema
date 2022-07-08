/**
 * - `'none'` - Do as little validation as possible and best-effort transformations
 * - `'soft'` - Keep going even after validation errors occur – use to keep best-effort transformations
 * - `'hard'` - If there are validation errors, stop immediately - transformations may be incomplete
 */
export type ValidationMode = 'none' | 'soft' | 'hard';

export interface ValidationOptions {
  /**
   * The mode for validation.
   *
   * @defaultValue `'hard'`
   */
  validation?: ValidationMode;
}
