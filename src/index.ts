// Core exports
export { DataStorage, InMemoryAdapter } from './core/storage';
export type { StorageAdapter, AllowedData, StringMap, Message, MemoryStore } from './core/types';
import { StringMapStorage } from './utils/string-map-storage';
import { ChatMemory, PersistentChatMemory } from './utils/memory';
export const createMemory = () => new ChatMemory();
export const createStringMap = () => new StringMapStorage();
export { Emitter,emitter } from './utils/Emitter';
let JSONFileAdapter: any = null;
let LocalStorageAdapter: any = null;

// Detectar entorno y exportar condicionalmente
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
    // Estamos en Node.js
    try {
        const nodeAdapter = require('./adapters/json-file-adapter');
        JSONFileAdapter = nodeAdapter.JSONFileAdapter;
    } catch (error: any) {
        console.warn('JSONFileAdapter no disponible:', error);
    }
} else if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    // Estamos en el navegador
    try {
        const browserAdapter = require('./adapters/local-storage-adapter');
        LocalStorageAdapter = browserAdapter.LocalStorageAdapter;
    } catch (error: any) {
        console.warn('LocalStorageAdapter no disponible:', error);
    }
}

// Exportar los adapters disponibles
export { JSONFileAdapter, LocalStorageAdapter };

// Alias para compatibilidad
export const JSONFile = JSONFileAdapter;
export {
    ChatMemory,
    PersistentChatMemory,
    StringMapStorage,
}
// Utils exports