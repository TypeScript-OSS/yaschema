import type { LazyPath } from './lazy-path';

export interface UnknownKeysMeta {
  allowAll?: boolean;
  unknownKeys?: Set<string>;
  path?: LazyPath;
}
export const unknownKeysSpecialMetaKey = '__yaschemaMeta';
export type UnknownKeysByPath = { [unknownKeysSpecialMetaKey]?: UnknownKeysMeta } & {
  [key: string | number]: UnknownKeysByPath;
};
