export interface TransformationOptions {
  /**
   * If `true`, object keys that aren't explicitly declared in this schema will not be included in the transformed value.
   *
   * Individual schemas may override this preference.
   *
   * @defaultValue `false`
   */
  removeUnknownKeys?: boolean;

  /**
   * If `true`, transformations are allowed to mutate the input value.  Otherwise, the input value is deep cloned before transformations are
   * processed, which can be expensive.
   *
   * @defaultValue `false`
   */
  okToMutateInputValue?: boolean;
}
