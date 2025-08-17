/* const { JSONFileAdapter } = require('../src/adapters/json-file');
const { LocalStorageAdapter } = require('../src/adapters/local-storage');
const { InMemoryAdapter } = require('../src/core/storage');
const { promises: fs } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os'); */
import { InMemoryAdapter } from '../src/core/storage';
import { JSONFileAdapter } from '../src/adapters/json-file';
import { LocalStorageAdapter } from '../src/adapters/local-storage';
import { DataStorage } from '../src/core/storage';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
const { tmpdir } = os;
const {join, resolve} = path;
describe('InMemoryAdapter', () => {
  let adapter: InMemoryAdapter<any>;

  beforeEach(() => {
    adapter = new InMemoryAdapter<any>();
  });

  test('should store and retrieve data', async () => {
    const testData = { test: 'value' };
    await adapter.save('key1', testData);
    
    const retrieved = await adapter.load('key1');
    expect(retrieved).toEqual(testData);
  });

  test('should return null for non-existent keys', async () => {
    const result = await adapter.load('nonexistent');
    expect(result).toBeNull();
  });

  test('should delete data correctly', async () => {
    await adapter.save('key1', { test: 'value' });
    await adapter.delete('key1');
    
    const result = await adapter.load('key1');
    expect(result).toBeNull();
  });

  test('should clear all data', async () => {
    await adapter.save('key1', 'value1');
    await adapter.save('key2', 'value2');
    
    await adapter.clear();
    
    const result1 = await adapter.load('key1');
    const result2 = await adapter.load('key2');
    
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  test('should get all data', async () => {
    await adapter.save('key1', 'value1');
    await adapter.save('key2', 'value2');
    
    const all = await adapter.getAll();
    expect(all).toEqual({
      key1: 'value1',
      key2: 'value2'
    });
  });
});

describe('JSONFileAdapter', () => {
  let tempDir: string;
  let adapter: JSONFileAdapter<any>;
  let testFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'json-adapter-test-'));
    testFilePath = join(tempDir, 'test.json');
    adapter = new JSONFileAdapter<any>(testFilePath);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should create file and store data', async () => {
    const testData = { name: 'test', value: 123 };
    await adapter.save('key1', testData);
    
    const retrieved = await adapter.load('key1');
    expect(retrieved).toEqual(testData);
  });

  test('should persist data across adapter instances', async () => {
    const testData = { persistent: true };
    await adapter.save('key1', testData);
    
    // Create new adapter instance with same file
    const newAdapter = new JSONFileAdapter<any>(testFilePath);
    const retrieved = await newAdapter.load('key1');
    
    expect(retrieved).toEqual(testData);
  });

  test('should handle non-existent file gracefully', async () => {
    const nonExistentPath = join(tempDir, 'nonexistent.json');
    const newAdapter = new JSONFileAdapter<any>(nonExistentPath);
    
    const result = await newAdapter.load('key1');
    expect(result).toBeNull();
  });

  test('should clear all data and update file', async () => {
    await adapter.save('key1', 'value1');
    await adapter.save('key2', 'value2');
    
    await adapter.clear();
    
    const result1 = await adapter.load('key1');
    const result2 = await adapter.load('key2');
    
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  test('should get all data from file', async () => {
    await adapter.save('key1', 'value1');
    await adapter.save('key2', { nested: 'object' });
    
    const all = await adapter.getAll();
    expect(all).toEqual({
      key1: 'value1',
      key2: { nested: 'object' }
    });
  });

  test('should handle complex nested objects', async () => {
    const complexData = {
      user: {
        id: 1,
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true
          }
        },
        tags: ['admin', 'user']
      }
    };
    
    await adapter.save('complex', complexData);
    const retrieved = await adapter.load('complex');
    
    expect(retrieved).toEqual(complexData);
  });
});

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