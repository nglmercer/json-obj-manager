// src/adapters/session-storage.ts
import type { StorageAdapter } from '../core/types.js';

export class SessionStorageAdapter<T> implements StorageAdapter<T> {
  private storageKey: string;
  private cache: Record<string, T> = {};

  constructor(storageKey: string = 'app-session-storage') {
    this.storageKey = storageKey;
    // Check if sessionStorage is available (prevents errors in SSR environments)
    if (typeof sessionStorage !== 'undefined') {
      this.loadCache();
    }
  }

  private loadCache(): void {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      this.cache = stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Error loading from sessionStorage:', error);
      this.cache = {};
    }
  }

  private saveCache(): void {
    if (typeof sessionStorage === 'undefined') {
      console.warn('sessionStorage is not available. Data will not be persisted.');
      return;
    }
    try {
      const dataString = JSON.stringify(this.cache);
      
      // Verificar si excede el límite de sessionStorage (aproximadamente 5-10MB)
      if (dataString.length > 5 * 1024 * 1024) {
        console.warn('Data size exceeds recommended sessionStorage limit (5MB)');
      }
      
      sessionStorage.setItem(this.storageKey, dataString);
    } catch (error) {
      // Manejar errores específicos de sessionStorage
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          throw new Error('SessionStorage quota exceeded. Consider clearing some data or using a different storage method.');
        }
      }
      console.warn('Error saving to sessionStorage:', error);
      throw new Error(`SessionStorage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Método para sincronizar con sessionStorage
  sync(): void {
    this.loadCache();
  }

  // Método para eliminar completamente del sessionStorage
  destroy(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
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

  // Método para verificar si sessionStorage está disponible
  static isAvailable(): boolean {
    try {
      if (typeof sessionStorage === 'undefined') return false;
      const testKey = '__sessionStorage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}