// tests/batch.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  BatchProcessor,
  TransactionProcessor,
  BatchBuilder,
  createBatchProcessor,
  createTransaction,
  createBatchBuilder,
  type BatchOperation,
  type BatchResult
} from '../src/utils/batch.js';
import { DataStorage } from '../src/core/storage.js';
import { InMemoryAdapter } from '../src/core/storage.js';

describe('BatchProcessor', () => {
  let storage: DataStorage<string>;
  let batchProcessor: BatchProcessor<string>;
  
  beforeEach(() => {
    storage = new DataStorage(new InMemoryAdapter<string>());
    batchProcessor = new BatchProcessor(storage);
  });
  
  describe('Basic batch operations', () => {
    it('should execute save operations in batch', async () => {
      const operations: BatchOperation[] = [
        { type: 'save', key: 'key1', value: 'value1' },
        { type: 'save', key: 'key2', value: 'value2' },
        { type: 'save', key: 'key3', value: 'value3' }
      ];
      
      const result = await batchProcessor.executeBatch(operations);
      
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      
      // Verify data was saved
      expect(await storage.load('key1')).toBe('value1');
      expect(await storage.load('key2')).toBe('value2');
      expect(await storage.load('key3')).toBe('value3');
    });
    
    it('should execute delete operations in batch', async () => {
      // Setup initial data
      await storage.save('key1', 'value1');
      await storage.save('key2', 'value2');
      
      const operations: BatchOperation[] = [
        { type: 'delete', key: 'key1' },
        { type: 'delete', key: 'key2' }
      ];
      
      const result = await batchProcessor.executeBatch(operations);
      
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(2);
      
      // Verify data was deleted
      expect(await storage.load('key1')).toBeNull();
      expect(await storage.load('key2')).toBeNull();
    });
    
    it('should execute mixed operations in batch', async () => {
      await storage.save('existing', 'old_value');
      
      const operations: BatchOperation[] = [
        { type: 'save', key: 'new_key', value: 'new_value' },
        { type: 'delete', key: 'existing' },
        { type: 'save', key: 'another_key', value: 'another_value' }
      ];
      
      const result = await batchProcessor.executeBatch(operations);
      
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(3);
      
      expect(await storage.load('new_key')).toBe('new_value');
      expect(await storage.load('another_key')).toBe('another_value');
      expect(await storage.load('existing')).toBeNull();
    });
  });
  
  describe('Batch chunking', () => {
    it('should split large batches into chunks', async () => {
      const processor = new BatchProcessor(storage, { maxBatchSize: 2 });
      
      const operations: BatchOperation[] = [
        { type: 'save', key: 'key1', value: 'value1' },
        { type: 'save', key: 'key2', value: 'value2' },
        { type: 'save', key: 'key3', value: 'value3' },
        { type: 'save', key: 'key4', value: 'value4' },
        { type: 'save', key: 'key5', value: 'value5' }
      ];
      
      const result = await processor.executeBatch(operations);
      
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(5);
      
      // Verify all data was saved
      for (let i = 1; i <= 5; i++) {
        expect(await storage.load(`key${i}`)).toBe(`value${i}`);
      }
    });
    
    it('should handle delays between batches', async () => {
      const processor = new BatchProcessor(storage, {
        maxBatchSize: 2,
        delayBetweenBatches: 10
      });
      
      const operations: BatchOperation[] = [
        { type: 'save', key: 'key1', value: 'value1' },
        { type: 'save', key: 'key2', value: 'value2' },
        { type: 'save', key: 'key3', value: 'value3' }
      ];
      
      const startTime = Date.now();
      const result = await processor.executeBatch(operations);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(10);
    });
  });
  
  describe('Error handling', () => {
    it('should handle individual operation failures', async () => {
      // Mock storage to fail on specific key
      const mockStorage = {
        ...storage,
        save: jest.fn().mockImplementation((...args: unknown[]) => {
          const [key, value] = args as [string, string];
          if (key === 'fail_key') {
            throw new Error('Save failed');
          }
          return storage.save(key, value);
        })
      } as any;
      
      const processor = new BatchProcessor(mockStorage);
      
      const operations: BatchOperation[] = [
        { type: 'save', key: 'success_key', value: 'success_value' },
        { type: 'save', key: 'fail_key', value: 'fail_value' },
        { type: 'save', key: 'another_success', value: 'another_value' }
      ];
      
      const result = await processor.executeBatch(operations);
      
      expect(result.success).toBe(false);
      expect(result.operations).toHaveLength(3);
      expect(result.operations[0].success).toBe(true);
      expect(result.operations[1].success).toBe(false);
      expect(result.operations[1].error).toBe('Save failed');
      expect(result.operations[2].success).toBe(true);
      expect(result.errors).toContain("Save operation failed for key 'fail_key': Save failed");
    });
  });
  
  describe('Convenience methods', () => {
    it('should batch save multiple key-value pairs', async () => {
      const data = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      };
      
      const result = await batchProcessor.batchSave(data);
      
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(3);
      
      for (const [key, value] of Object.entries(data)) {
        expect(await storage.load(key)).toBe(value);
      }
    });
    
    it('should batch delete multiple keys', async () => {
      // Setup initial data
      await storage.save('key1', 'value1');
      await storage.save('key2', 'value2');
      await storage.save('key3', 'value3');
      
      const result = await batchProcessor.batchDelete(['key1', 'key3']);
      
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(2);
      
      expect(await storage.load('key1')).toBeNull();
        expect(await storage.load('key2')).toBe('value2'); // Should still exist
      expect(await storage.load('key3')).toBeNull();
    });
    
    it('should batch load multiple keys', async () => {
      // Setup initial data
      await storage.save('key1', 'value1');
      await storage.save('key2', 'value2');
      
      const result = await batchProcessor.batchLoad(['key1', 'key2', 'nonexistent']);
      
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        nonexistent: null
      });
    });
  });
});

describe('TransactionProcessor', () => {
  let storage: DataStorage<string>;
  let transaction: TransactionProcessor<string>;
  
  beforeEach(() => {
    storage = new DataStorage(new InMemoryAdapter<string>());
    transaction = new TransactionProcessor(storage);
  });
  
  describe('Basic transaction operations', () => {
    it('should commit successful transactions', async () => {
      const result = await transaction
        .save('key1', 'value1')
        .save('key2', 'value2')
        .delete('nonexistent')
        .commit();
      
      expect(result.success).toBe(true);
      expect(await storage.load('key1')).toBe('value1');
      expect(await storage.load('key2')).toBe('value2');
    });
    
    it('should rollback failed transactions', async () => {
      // Setup initial data
      await storage.save('existing', 'original_value');
      
      // Mock storage to fail on specific operation
      const mockStorage = {
        ...storage,
        save: jest.fn().mockImplementation((...args: unknown[]) => {
          const [key, value] = args as [string, string];
          if (key === 'fail_key') {
            throw new Error('Save failed');
          }
          return storage.save(key, value);
        }),
        load: storage.load.bind(storage),
        delete: storage.delete.bind(storage)
      } as any;
      
      const mockTransaction = new TransactionProcessor(mockStorage);
      
      try {
        await mockTransaction
          .save('existing', 'new_value')
          .save('fail_key', 'fail_value')
          .commit();
      } catch (error) {
        // Transaction should fail and rollback
      }
      
      // Original value should be restored
      expect(await storage.load('existing')).toBe('original_value');
    });
    
    it('should handle manual rollback', async () => {
      await storage.save('existing', 'original_value');
      
      transaction
        .save('existing', 'new_value')
        .save('new_key', 'new_value');
      
      // Manually rollback before commit
      await transaction.rollback();
      
      expect(await storage.load('existing')).toBe('original_value');
      expect(await storage.load('new_key')).toBeNull();
    });
  });
  
  describe('Transaction state management', () => {
    it('should prevent operations after commit', async () => {
      await transaction.save('key1', 'value1').commit();
      
      expect(() => transaction.save('key2', 'value2')).toThrow('Transaction has already been committed');
    });
    
    it('should prevent operations after rollback', async () => {
      transaction.save('key1', 'value1');
      await transaction.rollback();
      
      expect(() => transaction.save('key2', 'value2')).toThrow('Transaction has been rolled back');
    });
    
    it('should allow clearing pending operations', () => {
      transaction
        .save('key1', 'value1')
        .delete('key2');
      
      expect(transaction.getPendingOperations()).toHaveLength(2);
      
      transaction.clear();
      expect(transaction.getPendingOperations()).toHaveLength(0);
    });
  });
});

describe('BatchBuilder', () => {
  let builder: BatchBuilder;
  
  beforeEach(() => {
    builder = new BatchBuilder();
  });
  
  it('should build save operations', () => {
    const operations = builder
      .save('key1', 'value1')
      .save('key2', 'value2')
      .build();
    
    expect(operations).toEqual([
      { type: 'save', key: 'key1', value: 'value1' },
      { type: 'save', key: 'key2', value: 'value2' }
    ]);
  });
  
  it('should build delete operations', () => {
    const operations = builder
      .delete('key1')
      .delete('key2')
      .build();
    
    expect(operations).toEqual([
      { type: 'delete', key: 'key1' },
      { type: 'delete', key: 'key2' }
    ]);
  });
  
  it('should build mixed operations', () => {
    const operations = builder
      .save('key1', 'value1')
      .delete('key2')
      .save('key3', 'value3')
      .build();
    
    expect(operations).toEqual([
      { type: 'save', key: 'key1', value: 'value1' },
      { type: 'delete', key: 'key2' },
      { type: 'save', key: 'key3', value: 'value3' }
    ]);
  });
  
  it('should handle bulk operations', () => {
    const saveData = {
      key1: 'value1',
      key2: 'value2'
    };
    
    const deleteKeys = ['key3', 'key4'];
    
    const operations = builder
      .saveMultiple(saveData)
      .deleteMultiple(deleteKeys)
      .build();
    
    expect(operations).toEqual([
      { type: 'save', key: 'key1', value: 'value1' },
      { type: 'save', key: 'key2', value: 'value2' },
      { type: 'delete', key: 'key3' },
      { type: 'delete', key: 'key4' }
    ]);
  });
  
  it('should clear operations', () => {
    builder
      .save('key1', 'value1')
      .delete('key2');
    
    expect(builder.count()).toBe(2);
    
    builder.clear();
    expect(builder.count()).toBe(0);
    expect(builder.build()).toEqual([]);
  });
  
  it('should count operations', () => {
    expect(builder.count()).toBe(0);
    
    builder.save('key1', 'value1');
    expect(builder.count()).toBe(1);
    
    builder.delete('key2');
    expect(builder.count()).toBe(2);
  });
});

describe('Factory functions', () => {
  let storage: DataStorage<string>;
  
  beforeEach(() => {
    storage = new DataStorage(new InMemoryAdapter<string>());
  });
  
  it('should create batch processor with factory', () => {
    const processor = createBatchProcessor(storage, {
      maxBatchSize: 50,
      delayBetweenBatches: 100
    });
    
    expect(processor).toBeInstanceOf(BatchProcessor);
  });
  
  it('should create transaction with factory', () => {
    const transaction = createTransaction(storage);
    
    expect(transaction).toBeInstanceOf(TransactionProcessor);
  });
  
  it('should create batch builder with factory', () => {
    const builder = createBatchBuilder();
    
    expect(builder).toBeInstanceOf(BatchBuilder);
  });
});

describe('Integration tests', () => {
  let storage: DataStorage<string>;
  
  beforeEach(() => {
    storage = new DataStorage(new InMemoryAdapter<string>());
  });
  
  it('should work with batch builder and processor together', async () => {
    const builder = createBatchBuilder();
    const processor = createBatchProcessor(storage);
    
    const operations = builder
      .save('user:1', 'John')
      .save('user:2', 'Jane')
      .save('config:theme', 'dark')
      .delete('temp:data')
      .build();
    
    const result = await processor.executeBatch(operations);
    
    expect(result.success).toBe(true);
    expect(await storage.load('user:1')).toBe('John');
    expect(await storage.load('user:2')).toBe('Jane');
    expect(await storage.load('config:theme')).toBe('dark');
  });
  
  it('should work with transaction and batch operations', async () => {
    const transaction = createTransaction(storage);
    
    // Setup initial data
    await storage.save('counter', '0');
    
    const result = await transaction
      .save('counter', '1')
      .save('user:active', 'true')
      .save('session:id', 'abc123')
      .commit();
    
    expect(result.success).toBe(true);
    expect(await storage.load('counter')).toBe('1');
    expect(await storage.load('user:active')).toBe('true');
    expect(await storage.load('session:id')).toBe('abc123');
  });
});