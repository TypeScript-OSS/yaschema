export interface TransformationOptions {
  /**
   * If true, transformations are allowed to mutate the input value.  Otherwise, the input value is deep cloned before transformations are
   * processed, which can be expensive.
   *
   * @defaultValue `false`
   */
  okToMutateInputValue?: boolean;
}
