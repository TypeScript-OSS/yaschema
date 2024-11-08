/** The approximate maximum continuous amount of work that can be done without yielding for other work */
const DEFAULT_MAX_WORK_INTERVAL_MSEC = 5;

let globalAsyncMaxWorkIntervalMSec = DEFAULT_MAX_WORK_INTERVAL_MSEC;

export const getAsyncMaxWorkIntervalMSec = () => globalAsyncMaxWorkIntervalMSec;

/**
 * Updates the approximate maximum continuous amount of work that can be done without yielding for other work.  If no value is provided, the
 * default value (5) is used.
 *
 * @see `setAsyncTimeComplexityThreshold`
 */
export const setAsyncMaxWorkIntervalMSec = (intervalMSec: number | undefined) => {
  globalAsyncMaxWorkIntervalMSec = intervalMSec ?? DEFAULT_MAX_WORK_INTERVAL_MSEC;
};
