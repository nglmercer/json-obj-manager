// src/node.ts

// Exporta el adapter específico de Node.js
export { JSONFileAdapter } from './adapters/json-file.js';
export { JSONFileAdapter as JSONFile } from './adapters/json-file.js';

// Export utilities
export { DataValidator, DataTransformer, validators, schemas } from './utils/validation.js';
export { BatchProcessor, TransactionProcessor, createBatchProcessor, createTransaction, BatchBuilder, createBatchBuilder } from './utils/batch.js';
export { SimpleCompressionAdapter, GzipCompressionAdapter, SimpleEncryptionAdapter, AESEncryptionAdapter, SecureCompressionAdapter, createCompression, createEncryption, createSecureCompression, sizeUtils } from './utils/compression.js';