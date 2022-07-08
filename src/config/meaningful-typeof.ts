export type MeaningfulTypeofExtractor = (value: any) => string | undefined;
let globalMeaningfulTypeofExtractor: MeaningfulTypeofExtractor | undefined;

export const getMeaningfulTypeofExtractor = () => globalMeaningfulTypeofExtractor;

/** Registers a function that can determine a more human-meaningful type from a given value.  Basic types (ex. `number`) are automatically
 * determined, so there's no need to handle those.  However, when adding custom schema types, this can help debugging. */
export const setMeaningfulTypeofExtractor = (extractor: MeaningfulTypeofExtractor | undefined) => {
  globalMeaningfulTypeofExtractor = extractor;
};
