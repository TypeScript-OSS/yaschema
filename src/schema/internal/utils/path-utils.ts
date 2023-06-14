import type { LazyPath, PathParts, ResolvedLazyPath } from '../types/lazy-path';

/** Appends an object path component that can later be used for accessing an object at this location */
export const appendPathComponent =
  (path: LazyPath, component: string): LazyPath =>
  (outParts: Array<string | number>) => {
    path(outParts);
    outParts.push(component);
  };

/** Appends an array index component that can later be used for accessing an array at this location */
export const appendPathIndex =
  (path: LazyPath, index: number): LazyPath =>
  (outParts: Array<string | number>) => {
    path(outParts);
    outParts.push(index);
  };

/** If the specified path string is non-empty, returns a string like ` @ <path>`.  Otherwise, returns an empty string */
export const atPath = (path?: LazyPath) => ((path?.length ?? 0) > 0 ? ` @ ${resolveLazyPath(path)?.string ?? ''}` : '');

export function resolveLazyPath(path: LazyPath): ResolvedLazyPath;
export function resolveLazyPath(path?: LazyPath): ResolvedLazyPath | undefined;
export function resolveLazyPath(path?: LazyPath): ResolvedLazyPath | undefined {
  if (path === undefined) {
    return undefined;
  }

  const resolvedCache = (path as { __resolvedCache?: ResolvedLazyPath })['__resolvedCache'];
  if (resolvedCache !== undefined) {
    return resolvedCache;
  }

  const parts: PathParts = [];
  path(parts);
  const string = parts.map((p) => `[${JSON.stringify(p)}]`).join('');

  const output: ResolvedLazyPath = { string, parts };
  (path as { __resolvedCache?: ResolvedLazyPath })['__resolvedCache'] = output;
  return output;
}
