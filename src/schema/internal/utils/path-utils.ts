import type { LazyPath } from '../types/lazy-path';

/** Appends an object path component that can later be used for accessing an object at this location */
export const appendPathComponent =
  (path: LazyPath, component: string): LazyPath =>
  (outParts: string[]) => {
    if (typeof path === 'string') {
      outParts.push(path);
    } else {
      path(outParts);
    }
    outParts.push(`[${JSON.stringify(component)}]`);
  };

/** Appends an array index component that can later be used for accessing an array at this location */
export const appendPathIndex =
  (path: LazyPath, index: number): LazyPath =>
  (outParts: string[]) => {
    if (typeof path === 'string') {
      outParts.push(path);
    } else {
      path(outParts);
    }
    outParts.push(`[${index}]`);
  };

/** If the specified path string is non-empty, returns a string like ` @ <path>`.  Otherwise, returns an empty string */
export const atPath = (path?: LazyPath) => ((path?.length ?? 0) > 0 ? ` @ ${resolveLazyPath(path) ?? ''}` : '');

export function resolveLazyPath(path: LazyPath): string;
export function resolveLazyPath(path?: LazyPath): string | undefined;
export function resolveLazyPath(path?: LazyPath) {
  if (path === undefined) {
    return undefined;
  }

  if (typeof path === 'string') {
    return path;
  }

  const resolvedCache = (path as { resolvedCache?: string })['resolvedCache'];
  if (resolvedCache !== undefined) {
    return resolvedCache;
  }

  const parts: string[] = [];
  path(parts);
  const output = parts.join('');

  (path as { resolvedCache?: string })['resolvedCache'] = output;
  return output;
}
