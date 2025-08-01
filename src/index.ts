// Core exports
export { DataStorage, InMemoryAdapter } from './core/storage';
export type { StorageAdapter, AllowedData, StringMap, Message, MemoryStore } from './core/types';
import { StringMapStorage } from './utils/string-map-storage';
import { ChatMemory, PersistentChatMemory } from './utils/memory';
export const createMemory = () => new ChatMemory();
export const createStringMap = () => new StringMapStorage();
export { JSONFileAdapter,JSONFileAdapter as JSONFile } from './adapters/json-file-adapter';
export { LocalStorageAdapter } from './adapters/local-storage-adapter';
export { Emitter } from './utils/Emitter';
export {
    ChatMemory,
    PersistentChatMemory,
    StringMapStorage,
}
// Utils exports