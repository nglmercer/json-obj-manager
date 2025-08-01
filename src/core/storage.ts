import { StorageAdapter } from './types';
import { AllowedData } from './types';
import { Emitter } from '../utils/Emitter';

export class DataStorage<T extends AllowedData> {
  private adapter: StorageAdapter<T>;
  private emitter: Emitter;

  constructor(adapter: StorageAdapter<T>, emitter?: Emitter) {
    this.adapter = adapter;
    this.emitter = emitter || new Emitter();
  }

  async save(key: string, data: T): Promise<void> {
    if (!this.validateData(data)) {
      throw new Error('Invalid data format');
    }
    await this.adapter.save(key, data);
    this.emitter.emit('change', await this.getAll());
  }

  async load(key: string): Promise<T | null> {
    return await this.adapter.load(key);
  }

  async delete(key: string): Promise<void> {
    await this.adapter.delete(key);
    this.emitter.emit('change', await this.getAll());
  }

  async clear(): Promise<void> {
    await this.adapter.clear();
    this.emitter.emit('change', await this.getAll());
  }

  async getAll(): Promise<Record<string, T>> {
    // Si el adapter tiene método getAll, usarlo
    if (typeof this.adapter.getAll === 'function') {
      return await this.adapter.getAll();
    }
    
    // Fallback: cargar todos los datos individualmente
    // Esto es menos eficiente pero funciona
    return this.adapter.data || {};
  }

  private validateData(data: T): boolean {
    if (data === null || data === undefined) return false;
    return true;
  }

  public on(event: 'change', callback: (data: Record<string, T>) => void): () => void {
    return this.emitter.on(event, callback);
  }

  public once(event: 'change', callback: (data: Record<string, T>) => void): () => void {
    return this.emitter.once(event, callback);
  }

  public off(event: 'change', callback: (data: Record<string, T>) => void): void {
    this.emitter.off(event, callback);
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