/**
 * - `'none'` - Do as little validation as possible and best-effort transformations
 * - `'soft'` - Keep going even after validation errors occur – use to keep best-effort transformations
 * - `'hard'` - If there are validation errors, stop immediately - transformations may be incomplete
 */
export type ValidationMode = 'none' | 'soft' | 'hard';

export interface ValidationOptions {
  /**
   * If `true`, an error is returned if unknown keys are present.
   *
   * Individual schemas may override this preference.
   *
   * @defaultValue `false`
   */
  failOnUnknownKeys?: boolean;

  /**
   * The mode for validation.
   *
   * Individual schemas may lower the validation mode.
   *
   * @defaultValue `'hard'`
   */
  validation?: ValidationMode;
}
