/** The approximate number of items we want to validate synchronously in a single batch. */
const DEFAULT_ASYNC_TIME_COMPLEXITY_THRESHOLD = 250;

let globalAsyncTimeComplexityThreshold = DEFAULT_ASYNC_TIME_COMPLEXITY_THRESHOLD;

export const getAsyncTimeComplexityThreshold = () => globalAsyncTimeComplexityThreshold;

/**
 * Updates the time complexity threshold, which is the approximate number of items we want to validate synchronously in a single batch.  If
 * no value is provided, the default value (250) is used.
 *
 * After each batch, complex validators check if they should yield ("relax").
 *
 * @see `setAsyncMaxWorkIntervalMSec`
 */
export const setAsyncTimeComplexityThreshold = (threshold: number | undefined) => {
  globalAsyncTimeComplexityThreshold = threshold ?? DEFAULT_ASYNC_TIME_COMPLEXITY_THRESHOLD;
};
