import { Schema, schema } from '../..';

interface StoredObject<T> {
  storedValue: T;
  updateCount: number;
}
class Storage<T> {
  readonly storedSchema_: Schema<StoredObject<T>>;

  constructor(valueSchema: Schema<T>) {
    this.storedSchema_ = schema.object_noAutoOptional({
      storedValue: valueSchema,
      updateCount: schema.number()
    });
  }
}
