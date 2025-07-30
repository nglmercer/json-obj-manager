export interface StorageAdapter<T> {
  data?: Record<string, T>;
  getAll?(): Promise<Record<string, T>>; // Método opcional
  save(key: string, data: T): Promise<void>;
  load(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export type StringMap = Record<string, string>;
export type AllowedData = string | number | boolean | object | null;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface MemoryStore {
  addUserMessage(content: string): void;
  addAIMessage(content: string): void;
  getMessages(): Message[];
  clear(): void;
}