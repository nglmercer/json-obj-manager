// src/utils/batch.ts
import type { StorageAdapter, AllowedData } from '../core/types.js';
import { DataStorage } from '../core/storage.js';

// Batch operation types
export interface BatchOperation {
  type: 'save' | 'delete';
  key: string;
  value?: AllowedData;
}

export interface BatchResult {
  success: boolean;
  operations: BatchOperationResult[];
  errors: string[];
}

export interface BatchOperationResult {
  operation: BatchOperation;
  success: boolean;
  error?: string;
}

// Batch processor class
export class BatchProcessor<T extends AllowedData = AllowedData> {
  private storage: DataStorage<T>;
  private maxBatchSize: number;
  private delayBetweenBatches: number;

  constructor(
    storage: DataStorage<T>,
    options: {
      maxBatchSize?: number;
      delayBetweenBatches?: number;
    } = {}
  ) {
    this.storage = storage;
    this.maxBatchSize = options.maxBatchSize || 100;
    this.delayBetweenBatches = options.delayBetweenBatches || 0;
  }

  // Execute batch operations
  async executeBatch(operations: BatchOperation[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: true,
      operations: [],
      errors: []
    };

    // Split operations into chunks
    const chunks = this.chunkOperations(operations);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const chunkResult = await this.executeChunk(chunk);
        result.operations.push(...chunkResult.operations);
        result.errors.push(...chunkResult.errors);
        
        if (!chunkResult.success) {
          result.success = false;
        }

        // Add delay between batches if specified
        if (i < chunks.length - 1 && this.delayBetweenBatches > 0) {
          await this.delay(this.delayBetweenBatches);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Batch ${i + 1} failed: ${errorMessage}`);
        result.success = false;
      }
    }

    return result;
  }

  // Execute a single chunk of operations
  private async executeChunk(operations: BatchOperation[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: true,
      operations: [],
      errors: []
    };

    // Group operations by type for optimization
    const saveOps = operations.filter(op => op.type === 'save');
    const deleteOps = operations.filter(op => op.type === 'delete');

    // Execute save operations
    for (const op of saveOps) {
      try {
        await this.storage.save(op.key, op.value as T);
        result.operations.push({
          operation: op,
          success: true
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.operations.push({
          operation: op,
          success: false,
          error: errorMessage
        });
        result.errors.push(`Save operation failed for key '${op.key}': ${errorMessage}`);
        result.success = false;
      }
    }

    // Execute delete operations
    for (const op of deleteOps) {
      try {
        await this.storage.delete(op.key);
        result.operations.push({
          operation: op,
          success: true
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.operations.push({
          operation: op,
          success: false,
          error: errorMessage
        });
        result.errors.push(`Delete operation failed for key '${op.key}': ${errorMessage}`);
        result.success = false;
      }
    }

    return result;
  }

  // Split operations into chunks
  private chunkOperations(operations: BatchOperation[]): BatchOperation[][] {
    const chunks: BatchOperation[][] = [];
    
    for (let i = 0; i < operations.length; i += this.maxBatchSize) {
      chunks.push(operations.slice(i, i + this.maxBatchSize));
    }
    
    return chunks;
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch save multiple key-value pairs
  async batchSave(data: Record<string, T>): Promise<BatchResult> {
    const operations: BatchOperation[] = Object.entries(data).map(([key, value]) => ({
      type: 'save',
      key,
      value
    }));

    return this.executeBatch(operations);
  }

  // Batch delete multiple keys
  async batchDelete(keys: string[]): Promise<BatchResult> {
    const operations: BatchOperation[] = keys.map(key => ({
      type: 'delete',
      key
    }));

    return this.executeBatch(operations);
  }

  // Batch load multiple keys
  async batchLoad(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    
    // Split keys into chunks for efficient loading
    const chunks = this.chunkArray(keys, this.maxBatchSize);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Load all keys in parallel within the chunk
      const promises = chunk.map(async (key) => {
        try {
          const value = await this.storage.load(key);
          return { key, value };
        } catch {
          return { key, value: null };
        }
      });
      
      const chunkResults = await Promise.all(promises);
      
      for (const { key, value } of chunkResults) {
        result[key] = value;
      }
      
      // Add delay between batches if specified
      if (i < chunks.length - 1 && this.delayBetweenBatches > 0) {
        await this.delay(this.delayBetweenBatches);
      }
    }
    
    return result;
  }

  // Utility to chunk arrays
  private chunkArray<U>(array: U[], size: number): U[][] {
    const chunks: U[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Transaction-like operations
export class TransactionProcessor<T extends AllowedData = AllowedData> {
  private storage: DataStorage<T>;
  private operations: BatchOperation[] = [];
  private backupData: Map<string, T | null> = new Map();
  private isCommitted = false;
  private isRolledBack = false;

  constructor(storage: DataStorage<T>) {
    this.storage = storage;
  }

  // Add operation to transaction
  save(key: string, value: T): this {
    this.checkTransactionState();
    this.operations.push({ type: 'save', key, value });
    return this;
  }

  delete(key: string): this {
    this.checkTransactionState();
    this.operations.push({ type: 'delete', key });
    return this;
  }

  // Commit all operations
  async commit(): Promise<BatchResult> {
    this.checkTransactionState();
    
    try {
      // Create backup of existing data
      await this.createBackup();
      
      // Execute operations using batch processor
      const batchProcessor = new BatchProcessor(this.storage);
      const result = await batchProcessor.executeBatch(this.operations);
      
      if (result.success) {
        this.isCommitted = true;
        this.clearBackup();
      } else {
        // Rollback on failure
        await this.rollback();
      }
      
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  // Rollback all operations
  async rollback(): Promise<void> {
    if (this.isRolledBack || this.isCommitted) {
      return;
    }
    
    try {
      // Restore from backup
      for (const [key, value] of this.backupData) {
        if (value === null) {
          await this.storage.delete(key);
        } else {
          await this.storage.save(key, value);
        }
      }
      
      this.isRolledBack = true;
      this.clearBackup();
    } catch (error) {
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create backup of data that will be modified
  private async createBackup(): Promise<void> {
    for (const operation of this.operations) {
      if (!this.backupData.has(operation.key)) {
        try {
          const existingValue = await this.storage.load(operation.key);
          this.backupData.set(operation.key, existingValue);
        } catch {
          // Key doesn't exist, mark as null in backup
          this.backupData.set(operation.key, null);
        }
      }
    }
  }

  // Clear backup data
  private clearBackup(): void {
    this.backupData.clear();
  }

  // Check if transaction is in valid state
  private checkTransactionState(): void {
    if (this.isCommitted) {
      throw new Error('Transaction has already been committed');
    }
    if (this.isRolledBack) {
      throw new Error('Transaction has been rolled back');
    }
  }

  // Get pending operations
  getPendingOperations(): BatchOperation[] {
    return [...this.operations];
  }

  // Clear all pending operations
  clear(): void {
    this.checkTransactionState();
    this.operations = [];
    this.clearBackup();
  }
}

// Utility functions for creating batch processors
export function createBatchProcessor<T extends AllowedData = AllowedData>(
  storage: DataStorage<T>,
  options?: {
    maxBatchSize?: number;
    delayBetweenBatches?: number;
  }
): BatchProcessor<T> {
  return new BatchProcessor(storage, options);
}

export function createTransaction<T extends AllowedData = AllowedData>(
  storage: DataStorage<T>
): TransactionProcessor<T> {
  return new TransactionProcessor(storage);
}

// Batch operation builder
export class BatchBuilder {
  private operations: BatchOperation[] = [];

  save(key: string, value: AllowedData): this {
    this.operations.push({ type: 'save', key, value });
    return this;
  }

  delete(key: string): this {
    this.operations.push({ type: 'delete', key });
    return this;
  }

  saveMultiple(data: Record<string, AllowedData>): this {
    for (const [key, value] of Object.entries(data)) {
      this.save(key, value);
    }
    return this;
  }

  deleteMultiple(keys: string[]): this {
    for (const key of keys) {
      this.delete(key);
    }
    return this;
  }

  build(): BatchOperation[] {
    return [...this.operations];
  }

  clear(): this {
    this.operations = [];
    return this;
  }

  count(): number {
    return this.operations.length;
  }
}

export function createBatchBuilder(): BatchBuilder {
  return new BatchBuilder();
}