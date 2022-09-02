import _ from 'lodash';

/** Removes unknown keys, mutating the specified value */
export const processRemoveUnknownKeys = ({
  workingValue,
  unknownKeysByPath
}: {
  workingValue: any;
  unknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>>;
}) => {
  for (const [path, value] of Object.entries(unknownKeysByPath)) {
    if (value instanceof Set && value.size > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const obj = path === '' ? workingValue : _.get(workingValue, path);
      if (obj !== null && typeof obj === 'object') {
        for (const key of value) {
          _.unset(obj, key);
        }
      }
    }
  }
};
