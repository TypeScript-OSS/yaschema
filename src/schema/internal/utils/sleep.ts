/** Resolves a promise after the specified amount of time */
export const sleep = async (durationMSec: number) => new Promise<void>((resolve) => setTimeout(resolve, durationMSec));
