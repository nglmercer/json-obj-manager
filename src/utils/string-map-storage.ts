import { DataStorage, InMemoryAdapter } from '../core/storage.js';
import { StringMap, StorageAdapter } from '../core/types.js';

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

  // Override del método getAll para devolver específicamente StringMap
  override async getAll(): Promise<Record<string, StringMap>> {
    return await super.getAll();
  }

  // Método específico para obtener el StringMap completo
  async getStringMap(): Promise<StringMap> {
    return (await this.load('string-map')) || {};
  }

  // Método para obtener todas las claves
  async getKeys(): Promise<string[]> {
    const data = await this.getStringMap();
    return Object.keys(data);
  }

  // Método para obtener todos los valores
  async getValues(): Promise<string[]> {
    const data = await this.getStringMap();
    return Object.values(data);
  }
}