// src/browser.ts

// Exporta el adapter específico del navegador
export { LocalStorageAdapter } from './adapters/local-storage.js';

// Export new adapters
export { SessionStorageAdapter } from './adapters/session-storage.js';
export { IndexedDBAdapter } from './adapters/indexeddb.js';

// Export utilities
export { DataValidator, DataTransformer, validators, schemas } from './utils/validation.js';
export { BatchProcessor, TransactionProcessor, createBatchProcessor, createTransaction, BatchBuilder, createBatchBuilder } from './utils/batch.js';
export { SimpleCompressionAdapter, GzipCompressionAdapter, SimpleEncryptionAdapter, AESEncryptionAdapter, SecureCompressionAdapter, createCompression, createEncryption, createSecureCompression, sizeUtils } from './utils/compression.js';
