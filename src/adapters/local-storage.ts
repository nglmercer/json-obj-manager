// src/adapters/local-storage.ts
import type { StorageAdapter } from '../core/types.js';

export class LocalStorageAdapter<T> implements StorageAdapter<T> {
  private storageKey: string;
  private cache: Record<string, T> = {};

  constructor(storageKey: string = 'app-storage') {
    this.storageKey = storageKey;
    // Check if localStorage is available (prevents errors in SSR environments)
    if (typeof localStorage !== 'undefined') {
      this.loadCache();
    }
  }

  private loadCache(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.cache = stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
      this.cache = {};
    }
  }
  private saveCache(): void {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage is not available. Data will not be persisted.');
      return;
    }
    try {
      const dataString = JSON.stringify(this.cache);
      
      // Verificar si excede el límite de localStorage (aproximadamente 5-10MB)
      if (dataString.length > 5 * 1024 * 1024) {
        console.warn('Data size exceeds recommended localStorage limit (5MB)');
      }
      
      localStorage.setItem(this.storageKey, dataString);
    } catch (error) {
      // Manejar errores específicos de localStorage
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          throw new Error('LocalStorage quota exceeded. Consider clearing some data or using a different storage method.');
        }
      }
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
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    this.cache = {};
  }

  // Método para obtener estadísticas de uso
  getStorageInfo(): { keyCount: number; estimatedSize: number; storageKey: string } {
    const dataString = JSON.stringify(this.cache);
    return {
      keyCount: Object.keys(this.cache).length,
      estimatedSize: dataString.length,
      storageKey: this.storageKey
    };
  }

  // Método para verificar si localStorage está disponible
  static isAvailable(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}