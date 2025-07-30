import { DataStorage, InMemoryAdapter } from '../core/storage';
import { StringMap, StorageAdapter } from '../core/types';

export class StringMapStorage extends DataStorage<StringMap> {
  constructor(adapter?: StorageAdapter<StringMap>) {
    super(adapter || new InMemoryAdapter<StringMap>());
  }

  // Métodos específicos para StringMap
  async setValue(key: string, value: string): Promise<void> {
    const data = await this.load('string-map') || {};
    data[key] = value;
    await this.save('string-map', data);
  }

  async getValue(key: string): Promise<string | undefined> {
    const data = await this.load('string-map');
    return data?.[key];
  }

  async removeKey(key: string): Promise<void> {
    const data = await this.load('string-map') || {};
    delete data[key];
    await this.save('string-map', data);
  }
  //@ts-ignore
  async getAll(): Promise<StringMap> {
    return (await this.load('string-map')) || {};
  }
}