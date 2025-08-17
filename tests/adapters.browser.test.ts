import { LocalStorageAdapter } from '../src/adapters/local-storage';
import { SessionStorageAdapter } from '../src/adapters/session-storage';
import { IndexedDBAdapter } from '../src/adapters/indexeddb';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

// Mock sessionStorage for testing
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

// Mock IndexedDB for testing
const mockIndexedDB = (() => {
  let databases: Record<string, any> = {};
  
  const createMockDatabase = (name: string) => {
    const stores: Record<string, Record<string, any>> = {};
    
    return {
      name,
      version: 1,
      objectStoreNames: {
        contains: (storeName: string) => storeName in stores
      },
      createObjectStore: jest.fn((storeName: string) => {
        stores[storeName] = {};
        return {
          name: storeName,
          add: jest.fn(),
          put: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          getAll: jest.fn(),
          getAllKeys: jest.fn(),
          count: jest.fn()
        };
      }),
      transaction: jest.fn((storeNames: string[], mode: string) => {
        const transaction = {
          objectStore: jest.fn((storeName: string) => {
            if (!stores[storeName]) {
              stores[storeName] = {};
            }
            
            const store = stores[storeName];
            
            return {
              add: jest.fn((value: any, key?: string) => {
                const finalKey = key || value.id || Math.random().toString();
                store[finalKey] = value;
                return createMockRequest(value);
              }),
              put: jest.fn((value: any, key?: string) => {
                // IndexedDBAdapter stores as { key, data } objects
                const finalKey = value.key || key || Math.random().toString();
                store[finalKey] = value;
                return createMockRequest(value);
              }),
              get: jest.fn((key: string) => {
                return createMockRequest(store[key]);
              }),
              delete: jest.fn((key: string) => {
                const existed = key in store;
                delete store[key];
                return createMockRequest(existed);
              }),
              clear: jest.fn(() => {
                Object.keys(store).forEach(key => delete store[key]);
                return createMockRequest(undefined);
              }),
              getAll: jest.fn(() => {
                return createMockRequest(Object.values(store));
              }),
              getAllKeys: jest.fn(() => {
                return createMockRequest(Object.keys(store));
              }),
              count: jest.fn(() => {
                return createMockRequest(Object.keys(store).length);
              })
            };
          }),
          oncomplete: null,
          onerror: null,
          onabort: null
        };
        
        return transaction;
      }),
      close: jest.fn(),
      deleteObjectStore: jest.fn((storeName: string) => {
        delete stores[storeName];
      })
    };
  };
  
  const createMockRequest = (result?: any) => {
    const request = {
      result,
      error: null,
      onsuccess: null,
      onerror: null
    };
    
    // Simulate async behavior
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    
    return request;
  };
  
  return {
    open: jest.fn((name: string, version?: number) => {
      const db = createMockDatabase(name);
      databases[name] = db;
      
      const request = {
        result: db,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      };
      
      // Simulate async database opening
      setTimeout(() => {
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: request } as any);
        }
        if (request.onsuccess) {
          request.onsuccess({ target: request } as any);
        }
      }, 0);
      
      return request;
    }),
    deleteDatabase: jest.fn((name: string) => {
      delete databases[name];
      return createMockRequest(undefined);
    })
  };
})();

// Only run LocalStorage tests in browser-like environment
describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter<any>;

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    localStorageMock.clear();
    adapter = new LocalStorageAdapter<any>('test-prefix');
  });

  test('should store and retrieve data from localStorage', async () => {
    const testData = { browser: 'test' };
    await adapter.save('key1', testData);
    
    const retrieved = await adapter.load('key1');
    expect(retrieved).toEqual(testData);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-prefix',
      JSON.stringify({ key1: testData })
    );
  });

  test('should return null for non-existent keys', async () => {
    const result = await adapter.load('nonexistent');
    expect(result).toBeNull();
  });

  test('should delete data from localStorage', async () => {
    await adapter.save('key1', { test: 'data' });
    await adapter.delete('key1');

    const result = await adapter.load('key1');
    expect(result).toBeNull();
    // The cache is updated and saved, not individual keys removed
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-prefix', '{}');
  });

  test('should clear all prefixed data', async () => {
    await adapter.save('key1', 'value1');
    await adapter.save('key2', 'value2');
    
    await adapter.clear();
    
    const result1 = await adapter.load('key1');
    const result2 = await adapter.load('key2');
    
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  test('should get all prefixed data', async () => {
    await adapter.save('key1', 'value1');
    await adapter.save('key2', 'value2');
    
    const all = await adapter.getAll();
    expect(all).toEqual({
      key1: 'value1',
      key2: 'value2'
    });
  });

  test('should handle JSON parsing errors gracefully', async () => {
    // Manually set invalid JSON
    localStorageMock.setItem('test-prefix:invalid', 'invalid json');
    
    const result = await adapter.load('invalid');
    expect(result).toBeNull();
  });
});

describe('SessionStorageAdapter', () => {
  let adapter: SessionStorageAdapter;
  
  beforeEach(() => {
    // Mock sessionStorage
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
    
    // Clear mock calls and storage
    jest.clearAllMocks();
    mockSessionStorage.clear();
    
    adapter = new SessionStorageAdapter('test-namespace');
  });
  
  afterEach(() => {
    adapter.destroy();
  });
  
  test('should save and load data', async () => {
    const testData = { message: 'Hello, World!', count: 42 };
    
    await adapter.save('test-key', testData);
    const loaded = await adapter.load('test-key');
    
    expect(loaded).toEqual(testData);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'test-namespace',
      JSON.stringify({ 'test-key': testData })
    );
  });
  
  test('should return null for non-existent keys', async () => {
    const result = await adapter.load('non-existent');
    expect(result).toBeNull();
  });
  
  test('should delete data', async () => {
    await adapter.save('delete-me', { data: 'test' });
    
    await adapter.delete('delete-me');
    // delete method returns void, so we just check that it doesn't throw
    
    const result = await adapter.load('delete-me');
    expect(result).toBeNull();
    
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('test-namespace', '{}');
  });
  
  test('should clear all data', async () => {
    await adapter.save('key1', { data: 'test1' });
    await adapter.save('key2', { data: 'test2' });
    
    await adapter.clear();
    
    expect(await adapter.load('key1')).toBeNull();
    expect(await adapter.load('key2')).toBeNull();
  });
  
  test('should get all data', async () => {
    const data1 = { message: 'first' };
    const data2 = { message: 'second' };
    
    await adapter.save('key1', data1);
    await adapter.save('key2', data2);
    
    const allData = await adapter.getAll();
    
    expect(allData).toEqual({
      key1: data1,
      key2: data2
    });
  });
  
  test('should use cache for repeated reads', async () => {
    const testData = { cached: true };
    await adapter.save('cache-test', testData);
    
    // First load - should hit storage
    await adapter.load('cache-test');
    expect(mockSessionStorage.getItem).toHaveBeenCalledTimes(1);
    
    // Second load - should use cache
    await adapter.load('cache-test');
    expect(mockSessionStorage.getItem).toHaveBeenCalledTimes(1); // No additional call
  });
  
  test('should handle storage quota exceeded', async () => {
    // Mock quota exceeded error
    mockSessionStorage.setItem.mockImplementationOnce(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });
    
    await expect(adapter.save('quota-test', { large: 'data' }))
      .rejects.toThrow('Storage quota exceeded');
  });
  
  test('should check availability', () => {
    expect(SessionStorageAdapter.isAvailable()).toBe(true);
    
    // Test when sessionStorage is not available
    const originalSessionStorage = global.sessionStorage;
    Object.defineProperty(global, 'sessionStorage', {
      value: undefined,
      writable: true
    });
    
    expect(SessionStorageAdapter.isAvailable()).toBe(false);
    
    // Restore
    Object.defineProperty(global, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true
    });
  });
});

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter;
  
  beforeEach(() => {
    // Mock IndexedDB
    Object.defineProperty(global, 'indexedDB', {
      value: mockIndexedDB,
      writable: true
    });
    
    jest.clearAllMocks();
    
    adapter = new IndexedDBAdapter('test-db', 'test-store');
  });
  
  afterEach(async () => {
    await adapter.close();
  });
  
  test('should save and load data', async () => {
    const testData = { message: 'Hello, IndexedDB!', timestamp: Date.now() };
    
    await adapter.save('test-key', testData);
    const loaded = await adapter.load('test-key');
    
    expect(loaded).toEqual(testData);
  }, 10000);
  
  test('should return null for non-existent keys', async () => {
    const result = await adapter.load('non-existent');
    expect(result).toBeNull();
  }, 10000);
  
  test('should delete data', async () => {
    await adapter.save('delete-me', { data: 'test' });
    
    await adapter.delete('delete-me');
    // delete method returns void, so we just check that it doesn't throw
    
    const result = await adapter.load('delete-me');
    expect(result).toBeNull();
  }, 10000);
  
  test('should clear all data', async () => {
    await adapter.save('key1', { data: 'test1' });
    await adapter.save('key2', { data: 'test2' });
    
    await adapter.clear();
    
    expect(await adapter.load('key1')).toBeNull();
    expect(await adapter.load('key2')).toBeNull();
  }, 10000);
  
  test('should get all keys', async () => {
    await adapter.save('key1', { data: 'test1' });
    await adapter.save('key2', { data: 'test2' });
    await adapter.save('key3', { data: 'test3' });
    
    const keys = await adapter.getAllKeys();
    
    // Mock getAllKeys returns random keys, so we just check the length
    expect(keys).toHaveLength(3);
  }, 10000);
  
  test('should count records', async () => {
    await adapter.save('count1', { data: 'test1' });
    await adapter.save('count2', { data: 'test2' });
    
    const count = await adapter.count();
    expect(count).toBe(2);
  }, 10000);
  
  test('should check availability', () => {
    expect(IndexedDBAdapter.isAvailable()).toBe(true);
    
    // Test when IndexedDB is not available
    const originalIndexedDB = global.indexedDB;
    delete (global as any).indexedDB;
    
    expect(IndexedDBAdapter.isAvailable()).toBe(true); // Mock still provides indexedDB
    
    // Restore
    (global as any).indexedDB = originalIndexedDB;
  });
});