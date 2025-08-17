// tests/compression.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  SimpleCompressionAdapter,
  GzipCompressionAdapter,
  SimpleEncryptionAdapter,
  AESEncryptionAdapter,
  SecureCompressionAdapter,
  createCompression,
  createEncryption,
  createSecureCompression,
  sizeUtils
} from '../src/utils/compression.js';

describe('SimpleCompressionAdapter', () => {
  let adapter: SimpleCompressionAdapter;
  
  beforeEach(() => {
    adapter = new SimpleCompressionAdapter();
  });
  
  it('should compress and decompress data', () => {
    const originalData = 'Hello, World! This is a test string for compression.';
    
    const compressed = adapter.compress(originalData);
    expect(compressed).not.toBe(originalData);
    expect(compressed.length).toBeGreaterThan(0);
    
    const decompressed = adapter.decompress(compressed);
    expect(decompressed).toBe(originalData);
  });
  
  it('should handle empty strings', () => {
    const compressed = adapter.compress('');
    expect(compressed).toBe('');
    
    const decompressed = adapter.decompress('');
    expect(decompressed).toBe('');
  });
  
  it('should handle repetitive data efficiently', () => {
    const repetitiveData = 'aaaaaaaaaa'.repeat(100);
    const compressed = adapter.compress(repetitiveData);
    
    expect(compressed.length).toBeLessThan(repetitiveData.length);
    
    const decompressed = adapter.decompress(compressed);
    expect(decompressed).toBe(repetitiveData);
  });
  
  it('should calculate compression ratio', () => {
    const ratio = adapter.getCompressionRatio(1000, 500);
    expect(ratio).toBe(0.5);
    
    const noCompression = adapter.getCompressionRatio(1000, 1000);
    expect(noCompression).toBe(0);
    
    const zeroSize = adapter.getCompressionRatio(0, 0);
    expect(zeroSize).toBe(0);
  });
  
  it('should throw error for invalid compressed data', () => {
    expect(() => adapter.decompress('invalid-data')).toThrow('Invalid encoded data');
  });
});

describe('GzipCompressionAdapter', () => {
  let adapter: GzipCompressionAdapter;
  
  beforeEach(() => {
    adapter = new GzipCompressionAdapter();
  });
  
  it('should compress and decompress data', async () => {
    const originalData = 'Hello, World! This is a test string for gzip compression. '.repeat(10);
    
    const compressed = await adapter.compress(originalData);
    expect(compressed).not.toBe(originalData);
    expect(compressed.length).toBeGreaterThan(0);
    
    const decompressed = await adapter.decompress(compressed);
    expect(decompressed).toBe(originalData);
  });
  
  it('should handle empty strings', async () => {
    const compressed = await adapter.compress('');
    const decompressed = await adapter.decompress(compressed);
    expect(decompressed).toBe('');
  });
  
  it('should fallback to simple compression when gzip unavailable', async () => {
    // Mock CompressionStream as undefined
    const originalCompressionStream = global.CompressionStream;
    (global as any).CompressionStream = undefined;
    
    try {
      const originalData = 'Test data for fallback';
      const compressed = await adapter.compress(originalData);
      const decompressed = await adapter.decompress(compressed);
      
      expect(decompressed).toBe(originalData);
    } finally {
      (global as any).CompressionStream = originalCompressionStream;
    }
  });
  
  it('should calculate compression ratio', () => {
    const ratio = adapter.getCompressionRatio(2000, 800);
    expect(ratio).toBe(0.6);
  });
});

describe('SimpleEncryptionAdapter', () => {
  let adapter: SimpleEncryptionAdapter;
  
  beforeEach(() => {
    adapter = new SimpleEncryptionAdapter();
  });
  
  it('should encrypt and decrypt data', () => {
    const originalData = 'This is secret data that needs encryption';
    const key = 'my-secret-key';
    
    const encrypted = adapter.encrypt(originalData, key);
    expect(encrypted).not.toBe(originalData);
    expect(encrypted.length).toBeGreaterThan(0);
    
    const decrypted = adapter.decrypt(encrypted, key);
    expect(decrypted).toBe(originalData);
  });
  
  it('should produce different results with different keys', () => {
    const data = 'Same data';
    const key1 = 'key1';
    const key2 = 'key2';
    
    const encrypted1 = adapter.encrypt(data, key1);
    const encrypted2 = adapter.encrypt(data, key2);
    
    expect(encrypted1).not.toBe(encrypted2);
    
    expect(adapter.decrypt(encrypted1, key1)).toBe(data);
    expect(adapter.decrypt(encrypted2, key2)).toBe(data);
  });
  
  it('should handle empty data and keys', () => {
    expect(adapter.encrypt('', 'key')).toBe('');
    expect(adapter.encrypt('data', '')).toBe('data');
    expect(adapter.decrypt('', 'key')).toBe('');
    expect(adapter.decrypt('data', '')).toBe('data');
  });
  
  it('should throw error for invalid encrypted data', () => {
    expect(() => adapter.decrypt('invalid-base64!@#', 'key')).toThrow('Invalid encrypted data');
  });
});

describe('AESEncryptionAdapter', () => {
  let adapter: AESEncryptionAdapter;
  
  beforeEach(() => {
    adapter = new AESEncryptionAdapter();
  });
  
  it('should encrypt and decrypt data', async () => {
    const originalData = 'This is highly sensitive data that requires AES encryption';
    const password = 'strong-password-123';
    
    const encrypted = await adapter.encrypt(originalData, password);
    expect(encrypted).not.toBe(originalData);
    expect(encrypted.length).toBeGreaterThan(0);
    
    const decrypted = await adapter.decrypt(encrypted, password);
    expect(decrypted).toBe(originalData);
  });
  
  it('should produce different encrypted results each time (due to random IV)', async () => {
    const data = 'Same data';
    const password = 'same-password';
    
    const encrypted1 = await adapter.encrypt(data, password);
    const encrypted2 = await adapter.encrypt(data, password);
    
    // Should be different due to random IV
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both should decrypt to the same data
    expect(await adapter.decrypt(encrypted1, password)).toBe(data);
    expect(await adapter.decrypt(encrypted2, password)).toBe(data);
  });
  
  it('should fail with wrong password', async () => {
    const data = 'Secret data';
    const correctPassword = 'correct-password';
    const wrongPassword = 'wrong-password';
    
    const encrypted = await adapter.encrypt(data, correctPassword);
    
    // Should decrypt correctly with right password
    expect(await adapter.decrypt(encrypted, correctPassword)).toBe(data);
    
    // Should fallback to simple encryption with wrong password or crypto unavailable
    // (since AES will fallback to SimpleEncryptionAdapter on error)
    const result = await adapter.decrypt(encrypted, wrongPassword);
    expect(result).not.toBe(data); // Should not match original
  });
  
  it('should fallback to simple encryption when crypto unavailable', async () => {
    // Mock crypto as undefined
    const originalCrypto = global.crypto;
    (global as any).crypto = undefined;
    
    try {
      const originalData = 'Test data for fallback';
      const password = 'test-password';
      
      const encrypted = await adapter.encrypt(originalData, password);
      const decrypted = await adapter.decrypt(encrypted, password);
      
      expect(decrypted).toBe(originalData);
    } finally {
      (global as any).crypto = originalCrypto;
    }
  });
});

describe('SecureCompressionAdapter', () => {
  let adapter: SecureCompressionAdapter;
  
  beforeEach(() => {
    adapter = new SecureCompressionAdapter();
  });
  
  it('should compress and decompress without encryption', async () => {
    const originalData = 'This is data that will be compressed but not encrypted. '.repeat(20);
    
    const compressed = await adapter.compress(originalData);
    expect(compressed).not.toBe(originalData);
    
    const decompressed = await adapter.decompress(compressed);
    expect(decompressed).toBe(originalData);
  });
  
  it('should compress and encrypt data', async () => {
    const originalData = 'This is sensitive data that will be compressed and encrypted. '.repeat(15);
    const encryptionKey = 'secure-encryption-key';
    
    const compressedAndEncrypted = await adapter.compress(originalData, encryptionKey);
    expect(compressedAndEncrypted).not.toBe(originalData);
    
    const decompressedAndDecrypted = await adapter.decompress(compressedAndEncrypted, encryptionKey);
    expect(decompressedAndDecrypted).toBe(originalData);
  });
  
  it('should use custom compression and encryption adapters', async () => {
    const customCompression = new SimpleCompressionAdapter();
    const customEncryption = new SimpleEncryptionAdapter();
    const customAdapter = new SecureCompressionAdapter(customCompression, customEncryption);
    
    const originalData = 'Custom adapter test data';
    const key = 'test-key';
    
    const result = await customAdapter.compress(originalData, key);
    const restored = await customAdapter.decompress(result, key);
    
    expect(restored).toBe(originalData);
  });
  
  it('should calculate compression ratio', () => {
    const ratio = adapter.getCompressionRatio(1500, 600);
    expect(ratio).toBe(0.6);
  });
});

describe('Factory functions', () => {
  it('should create simple compression adapter', () => {
    const adapter = createCompression('simple');
    expect(adapter).toBeInstanceOf(SimpleCompressionAdapter);
  });
  
  it('should create gzip compression adapter', () => {
    const adapter = createCompression('gzip');
    expect(adapter).toBeInstanceOf(GzipCompressionAdapter);
  });
  
  it('should default to gzip compression', () => {
    const adapter = createCompression();
    expect(adapter).toBeInstanceOf(GzipCompressionAdapter);
  });
  
  it('should create simple encryption adapter', () => {
    const adapter = createEncryption('simple');
    expect(adapter).toBeInstanceOf(SimpleEncryptionAdapter);
  });
  
  it('should create AES encryption adapter', () => {
    const adapter = createEncryption('aes');
    expect(adapter).toBeInstanceOf(AESEncryptionAdapter);
  });
  
  it('should default to AES encryption', () => {
    const adapter = createEncryption();
    expect(adapter).toBeInstanceOf(AESEncryptionAdapter);
  });
  
  it('should create secure compression with specified types', () => {
    const adapter = createSecureCompression('simple', 'simple');
    expect(adapter).toBeInstanceOf(SecureCompressionAdapter);
  });
  
  it('should create secure compression with defaults', () => {
    const adapter = createSecureCompression();
    expect(adapter).toBeInstanceOf(SecureCompressionAdapter);
  });
});

describe('sizeUtils', () => {
  describe('getStringSize', () => {
    it('should calculate string size in bytes', () => {
      expect(sizeUtils.getStringSize('hello')).toBe(5);
      expect(sizeUtils.getStringSize('')).toBe(0);
      expect(sizeUtils.getStringSize('🚀')).toBeGreaterThan(1); // Unicode character
    });
  });
  
  describe('formatSize', () => {
    it('should format bytes correctly', () => {
      expect(sizeUtils.formatSize(0)).toBe('0.00 B');
      expect(sizeUtils.formatSize(512)).toBe('512.00 B');
      expect(sizeUtils.formatSize(1024)).toBe('1.00 KB');
      expect(sizeUtils.formatSize(1536)).toBe('1.50 KB');
      expect(sizeUtils.formatSize(1048576)).toBe('1.00 MB');
      expect(sizeUtils.formatSize(1073741824)).toBe('1.00 GB');
    });
  });
  
  describe('shouldCompress', () => {
    it('should determine if data should be compressed', () => {
      const smallData = 'small';
      const largeData = 'x'.repeat(2000);
      
      expect(sizeUtils.shouldCompress(smallData)).toBe(false);
      expect(sizeUtils.shouldCompress(largeData)).toBe(true);
      expect(sizeUtils.shouldCompress(smallData, 3)).toBe(true); // Custom threshold
    });
  });
});

describe('Integration tests', () => {
  it('should work with real-world data compression and encryption', async () => {
    const adapter = createSecureCompression('gzip', 'aes');
    
    // Simulate a large JSON object
    const largeData = JSON.stringify({
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true
        }
      })),
      metadata: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        checksum: 'abc123def456'
      }
    });
    
    const password = 'secure-app-password-2023';
    
    const originalSize = sizeUtils.getStringSize(largeData);
    console.log(`Original size: ${sizeUtils.formatSize(originalSize)}`);
    
    const compressed = await adapter.compress(largeData, password);
    const compressedSize = sizeUtils.getStringSize(compressed);
    console.log(`Compressed size: ${sizeUtils.formatSize(compressedSize)}`);
    
    const ratio = adapter.getCompressionRatio(originalSize, compressedSize);
    console.log(`Compression ratio: ${(ratio * 100).toFixed(2)}%`);
    
    const decompressed = await adapter.decompress(compressed, password);
    const parsedData = JSON.parse(decompressed);
    
    expect(parsedData.users).toHaveLength(100);
    expect(parsedData.users[0].name).toBe('User 0');
    expect(parsedData.metadata.version).toBe('1.0.0');
  });
  
  it('should handle compression without encryption for public data', async () => {
    const adapter = createSecureCompression();
    
    const publicData = JSON.stringify({
      articles: Array.from({ length: 50 }, (_, i) => ({
        id: i,
        title: `Article ${i}`,
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20),
        tags: ['tech', 'programming', 'javascript']
      }))
    });
    
    const compressed = await adapter.compress(publicData);
    const decompressed = await adapter.decompress(compressed);
    
    expect(JSON.parse(decompressed).articles).toHaveLength(50);
  });
});