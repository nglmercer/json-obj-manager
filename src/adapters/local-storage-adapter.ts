import { StorageAdapter } from '../core/types';

export class LocalStorageAdapter<T> implements StorageAdapter<T> {
  private storageKey: string;
  private cache: Record<string, T> = {};

  constructor(storageKey: string = 'app-storage') {
    this.storageKey = storageKey;
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.cache = JSON.parse(stored);
      } else {
        this.cache = {};
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
      this.cache = {};
    }
  }

  private saveCache(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
      throw new Error(`LocalStorage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async save(key: string, data: T): Promise<void> {
    this.cache[key] = data;
    this.saveCache();
  }

  async load(key: string): Promise<T | null> {
    return this.cache[key] || null;
  }

  async delete(key: string): Promise<void> {
    delete this.cache[key];
    this.saveCache();
  }

  async clear(): Promise<void> {
    this.cache = {};
    this.saveCache();
  }

  async getAll(): Promise<Record<string, T>> {
    return { ...this.cache };
  }

  // Método adicional para obtener la clave de almacenamiento
  getStorageKey(): string {
    return this.storageKey;
  }

  // Método para sincronizar con localStorage (útil si se modificó desde otra pestaña)
  sync(): void {
    this.loadCache();
  }

  // Método para eliminar completamente del localStorage
  destroy(): void {
    localStorage.removeItem(this.storageKey);
    this.cache = {};
  }
}