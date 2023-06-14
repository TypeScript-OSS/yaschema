export type PathParts = Array<string | number>;
export type LazyPath = (outParts: PathParts) => void;

export interface ResolvedLazyPath {
  string: string;
  parts: PathParts;
}
