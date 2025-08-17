// src/utils/compression.ts
import type { AllowedData } from '../core/types.js';

// Compression interface
export interface CompressionAdapter {
  compress(data: string): Promise<string> | string;
  decompress(compressedData: string): Promise<string> | string;
  getCompressionRatio(originalSize: number, compressedSize: number): number;
}

// Simple LZ-string like compression implementation
export class SimpleCompressionAdapter implements CompressionAdapter {
  compress(data: string): string {
    if (!data) return data;
    
    const dictionary: Record<string, number> = {};
    const result: (string | number)[] = [];
    let dictSize = 256;
    let w = '';
    
    // Initialize dictionary with single characters
    for (let i = 0; i < 256; i++) {
      dictionary[String.fromCharCode(i)] = i;
    }
    
    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const wc = w + c;
      
      if (dictionary[wc] !== undefined) {
        w = wc;
      } else {
        result.push(dictionary[w]);
        dictionary[wc] = dictSize++;
        w = c;
      }
    }
    
    if (w) {
      result.push(dictionary[w]);
    }
    
    // Convert to base64-like encoding
    return this.encodeNumbers(result);
  }
  
  decompress(compressedData: string): string {
    if (!compressedData) return compressedData;
    
    const numbers = this.decodeNumbers(compressedData);
    const dictionary: Record<number, string> = {};
    let dictSize = 256;
    let result = '';
    
    // Initialize dictionary
    for (let i = 0; i < 256; i++) {
      dictionary[i] = String.fromCharCode(i);
    }
    
    let w = String.fromCharCode(numbers[0]);
    result = w;
    
    for (let i = 1; i < numbers.length; i++) {
      const k = numbers[i];
      let entry: string;
      
      if (dictionary[k] !== undefined) {
        entry = dictionary[k];
      } else if (k === dictSize) {
        entry = w + w[0];
      } else {
        throw new Error('Invalid compressed data');
      }
      
      result += entry;
      dictionary[dictSize++] = w + entry[0];
      w = entry;
    }
    
    return result;
  }
  
  getCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return (originalSize - compressedSize) / originalSize;
  }
  
  private encodeNumbers(numbers: (string | number)[]): string {
    return btoa(JSON.stringify(numbers));
  }
  
  private decodeNumbers(encoded: string): number[] {
    try {
      const decoded = JSON.parse(atob(encoded));
      return Array.isArray(decoded) ? decoded : [];
    } catch {
      throw new Error('Invalid encoded data');
    }
  }
}

// Gzip-style compression (browser compatible)
export class GzipCompressionAdapter implements CompressionAdapter {
  async compress(data: string): Promise<string> {
    if (typeof CompressionStream === 'undefined') {
      // Fallback to simple compression
      const simple = new SimpleCompressionAdapter();
      return simple.compress(data);
    }
    
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    
    // Start compression
    const writePromise = writer.write(encoder.encode(data)).then(() => writer.close());
    
    // Read compressed data
    const readPromise = (async () => {
      let result;
      while (!(result = await reader.read()).done) {
        chunks.push(result.value);
      }
    })();
    
    await Promise.all([writePromise, readPromise]);
    
    // Combine chunks and encode as base64
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    return btoa(String.fromCharCode(...combined));
  }
  
  async decompress(compressedData: string): Promise<string> {
    if (typeof DecompressionStream === 'undefined') {
      // Fallback to simple compression
      const simple = new SimpleCompressionAdapter();
      return simple.decompress(compressedData);
    }
    
    try {
      // Decode from base64
      const binaryString = atob(compressedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      const decoder = new TextDecoder();
      const chunks: string[] = [];
      
      // Start decompression
      const writePromise = writer.write(bytes).then(() => writer.close());
      
      // Read decompressed data
      const readPromise = (async () => {
        let result;
        while (!(result = await reader.read()).done) {
          chunks.push(decoder.decode(result.value, { stream: true }));
        }
        chunks.push(decoder.decode()); // Final chunk
      })();
      
      await Promise.all([writePromise, readPromise]);
      
      return chunks.join('');
    } catch {
      // Fallback to simple compression
      const simple = new SimpleCompressionAdapter();
      return simple.decompress(compressedData);
    }
  }
  
  getCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return (originalSize - compressedSize) / originalSize;
  }
}

// Encryption interface
export interface EncryptionAdapter {
  encrypt(data: string, key: string): Promise<string> | string;
  decrypt(encryptedData: string, key: string): Promise<string> | string;
}

// Simple XOR encryption (not secure, for demo purposes)
export class SimpleEncryptionAdapter implements EncryptionAdapter {
  encrypt(data: string, key: string): string {
    if (!data || !key) return data;
    
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(dataChar ^ keyChar);
    }
    
    return btoa(result);
  }
  
  decrypt(encryptedData: string, key: string): string {
    if (!encryptedData || !key) return encryptedData;
    
    try {
      const data = atob(encryptedData);
      let result = '';
      
      for (let i = 0; i < data.length; i++) {
        const dataChar = data.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(dataChar ^ keyChar);
      }
      
      return result;
    } catch {
      throw new Error('Invalid encrypted data');
    }
  }
}

// AES encryption using Web Crypto API
export class AESEncryptionAdapter implements EncryptionAdapter {
  private algorithm = 'AES-GCM';
  private keyLength = 256;
  
  async encrypt(data: string, password: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      // Fallback to simple encryption
      const simple = new SimpleEncryptionAdapter();
      return simple.encrypt(data, password);
    }
    
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: this.algorithm, length: this.keyLength },
        false,
        ['encrypt']
      );
      
      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: this.algorithm, iv },
        key,
        dataBuffer
      );
      
      // Combine salt, IV, and encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch {
      // Fallback to simple encryption
      const simple = new SimpleEncryptionAdapter();
      return simple.encrypt(data, password);
    }
  }
  
  async decrypt(encryptedData: string, password: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      // Fallback to simple encryption
      const simple = new SimpleEncryptionAdapter();
      return simple.decrypt(encryptedData, password);
    }
    
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Decode from base64
      const binaryString = atob(encryptedData);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }
      
      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encryptedBuffer = combined.slice(28);
      
      // Derive key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: this.algorithm, length: this.keyLength },
        false,
        ['decrypt']
      );
      
      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: this.algorithm, iv },
        key,
        encryptedBuffer
      );
      
      return decoder.decode(decryptedBuffer);
    } catch {
      // Fallback to simple encryption
      const simple = new SimpleEncryptionAdapter();
      return simple.decrypt(encryptedData, password);
    }
  }
}

// Combined compression and encryption utility
export class SecureCompressionAdapter {
  private compression: CompressionAdapter;
  private encryption: EncryptionAdapter;
  
  constructor(
    compression?: CompressionAdapter,
    encryption?: EncryptionAdapter
  ) {
    this.compression = compression || new GzipCompressionAdapter();
    this.encryption = encryption || new AESEncryptionAdapter();
  }
  
  async compress(data: string, encryptionKey?: string): Promise<string> {
    let result = await this.compression.compress(data);
    
    if (encryptionKey) {
      result = await this.encryption.encrypt(result, encryptionKey);
    }
    
    return result;
  }
  
  async decompress(compressedData: string, encryptionKey?: string): Promise<string> {
    let result = compressedData;
    
    if (encryptionKey) {
      result = await this.encryption.decrypt(result, encryptionKey);
    }
    
    return await this.compression.decompress(result);
  }
  
  getCompressionRatio(originalSize: number, compressedSize: number): number {
    return this.compression.getCompressionRatio(originalSize, compressedSize);
  }
}

// Utility functions
export function createCompression(type: 'simple' | 'gzip' = 'gzip'): CompressionAdapter {
  switch (type) {
    case 'simple':
      return new SimpleCompressionAdapter();
    case 'gzip':
      return new GzipCompressionAdapter();
    default:
      return new GzipCompressionAdapter();
  }
}

export function createEncryption(type: 'simple' | 'aes' = 'aes'): EncryptionAdapter {
  switch (type) {
    case 'simple':
      return new SimpleEncryptionAdapter();
    case 'aes':
      return new AESEncryptionAdapter();
    default:
      return new AESEncryptionAdapter();
  }
}

export function createSecureCompression(
  compressionType: 'simple' | 'gzip' = 'gzip',
  encryptionType: 'simple' | 'aes' = 'aes'
): SecureCompressionAdapter {
  return new SecureCompressionAdapter(
    createCompression(compressionType),
    createEncryption(encryptionType)
  );
}

// Data size utilities
export const sizeUtils = {
  getStringSize(str: string): number {
    return new Blob([str]).size;
  },
  
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },
  
  shouldCompress(data: string, threshold: number = 1024): boolean {
    return this.getStringSize(data) > threshold;
  }
};