import { StorageAdapter } from './types';
import { AllowedData } from './types';
export class DataStorage<T extends AllowedData> {
  private adapter: StorageAdapter<T>;

  constructor(adapter: StorageAdapter<T>) {
    this.adapter = adapter;
  }

  async save(key: string, data: T): Promise<void> {
    if (!this.validateData(data)) {
      throw new Error('Invalid data format');
    }
    await this.adapter.save(key, data);
  }

  async load(key: string): Promise<T | null> {
    return await this.adapter.load(key);
  }

  async delete(key: string): Promise<void> {
    await this.adapter.delete(key);
  }

  async clear(): Promise<void> {
    await this.adapter.clear();
  }

  private validateData(data: T): boolean {
    // Validación básica - puedes extender según necesites
    if (data === null || data === undefined) return false;
    return true;
  }
}

// Adaptador en memoria para ejemplo
export class InMemoryAdapter<T> implements StorageAdapter<T> {
  private storage = new Map<string, T>();

  async save(key: string, data: T): Promise<void> {
    this.storage.set(key, data);
  }

  async load(key: string): Promise<T | null> {
    return this.storage.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}