// src/adapters/indexeddb.ts
import type { StorageAdapter } from '../core/types.js';

export class IndexedDBAdapter<T> implements StorageAdapter<T> {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(dbName: string = 'app-storage', storeName: string = 'data', version: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  private async initDB(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available in this environment'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message || 'Unknown error'}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });

    await this.initPromise;
    this.initPromise = null;
  }

  private async getTransaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.initDB();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction([this.storeName], mode);
    return transaction.objectStore(this.storeName);
  }

  async save(key: string, data: T): Promise<void> {
    const store = await this.getTransaction('readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, data });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save data: ${request.error?.message || 'Unknown error'}`));
    });
  }

  async load(key: string): Promise<T | null> {
    const store = await this.getTransaction('readonly');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      
      request.onerror = () => reject(new Error(`Failed to load data: ${request.error?.message || 'Unknown error'}`));
    });
  }

  async delete(key: string): Promise<void> {
    const store = await this.getTransaction('readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete data: ${request.error?.message || 'Unknown error'}`));
    });
  }

  async clear(): Promise<void> {
    const store = await this.getTransaction('readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear data: ${request.error?.message || 'Unknown error'}`));
    });
  }

  async getAll(): Promise<Record<string, T>> {
    const store = await this.getTransaction('readonly');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const result: Record<string, T> = {};
        for (const item of request.result) {
          result[item.key] = item.data;
        }
        resolve(result);
      };
      
      request.onerror = () => reject(new Error(`Failed to get all data: ${request.error?.message || 'Unknown error'}`));
    });
  }

  // Additional IndexedDB-specific methods
  async getAllKeys(): Promise<string[]> {
    const store = await this.getTransaction('readonly');
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      
      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
      
      request.onerror = () => reject(new Error(`Failed to get all keys: ${request.error?.message || 'Unknown error'}`));
    });
  }

  async count(): Promise<number> {
    const store = await this.getTransaction('readonly');
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to count items: ${request.error?.message || 'Unknown error'}`));
    });
  }

  async getStorageInfo(): Promise<{ keyCount: number; dbName: string; storeName: string; version: number }> {
    const keyCount = await this.count();
    return {
      keyCount,
      dbName: this.dbName,
      storeName: this.storeName,
      version: this.version
    };
  }

  // Close the database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Delete the entire database
  async deleteDatabase(): Promise<void> {
    this.close();
    
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available in this environment'));
        return;
      }

      const request = indexedDB.deleteDatabase(this.dbName);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete database: ${request.error?.message || 'Unknown error'}`));
    });
  }

  // Check if IndexedDB is available
  static isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }
}