/** Appends an object path component that can later be used for accessing an object at this location */
export const appendPathComponent = (path: string, component: string) => `${path ?? ''}[${JSON.stringify(component)}]`;

/** Appends an array index component that can later be used for accessing an array at this location */
export const appendPathIndex = (path: string, index: number) => `${path ?? ''}[${index}]`;

/** If the specified path string is non-empty, returns a string like ` @ <path>`.  Otherwise, returns an empty string */
export const atPath = (path?: string) => ((path?.length ?? 0) > 0 ? ` @ ${path ?? ''}` : '');
