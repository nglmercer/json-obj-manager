import { InMemoryAdapter } from '../src/core/storage';
import { JSONFileAdapter } from '../src/adapters/json-file';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
const { tmpdir } = os;
const { join } = path;

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