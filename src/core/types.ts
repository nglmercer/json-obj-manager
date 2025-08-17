export interface StorageAdapter<T> {
  data?: Record<string, T>;
  getAll?(): Promise<Record<string, T>>; // Método opcional
  save(key: string, data: T): Promise<void>;
  load(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Interfaz extendida para adaptadores con funcionalidades adicionales
export interface ExtendedStorageAdapter<T> extends StorageAdapter<T> {
  getAll(): Promise<Record<string, T>>; // Requerido en versión extendida
  isAvailable?(): boolean;
  getStorageInfo?(): { keyCount: number; estimatedSize: number };
}

export type StringMap = Record<string, string>;
export type AllowedData = string | number | boolean | null | { [key: string]: AllowedData } | AllowedData[] | StringMap | unknown;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface MemoryStore {
  addUserMessage(content: string, timestamp?: Date): void;
  addAIMessage(content: string, timestamp?: Date): void;
  getMessages(): Message[];
  getLastMessages(count?: number): Message[];
  clear(): void;
}