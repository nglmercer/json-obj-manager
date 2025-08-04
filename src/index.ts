// Core exports
export { DataStorage, InMemoryAdapter } from './core/storage.js';
export type { StorageAdapter, AllowedData, StringMap, Message, MemoryStore } from './core/types.js';
import { StringMapStorage } from './utils/string-map-storage.js';
import { ChatMemory, PersistentChatMemory } from './utils/memory.js';
export const createMemory = () => new ChatMemory();
export const createStringMap = () => new StringMapStorage();
export { Emitter } from './utils/Emitter.js';
export {
    ChatMemory,
    PersistentChatMemory,
    StringMapStorage,
}
// Utils exports