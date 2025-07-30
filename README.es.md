# README.md (Español)

## Librería de Almacenamiento Universal

Una librería TypeScript flexible que funciona tanto en Node.js (sistema de archivos) como en navegadores (localStorage) con una API unificada.

### Instalación

```bash
npm install json-obj-manager
```

### Uso Básico

#### Node.js (Sistema de Archivos)
```typescript
import { DataStorage, JSONFileAdapter } from 'json-obj-manager';
import path from 'path';

const storage = new DataStorage(new JSONFileAdapter(path.join(process.cwd(), 'data.json')));
await storage.save('user-1', { name: 'Juan', age: 30 });
const user = await storage.load('user-1');
```

#### Navegador (LocalStorage)
```typescript
import { DataStorage, LocalStorageAdapter } from 'json-obj-manager';

const storage = new DataStorage(new LocalStorageAdapter('my-app'));
await storage.save('user-1', { name: 'Juan', age: 30 });
const user = await storage.load('user-1');
```

## Clases Principales

### DataStorage<T>

Clase de almacenamiento genérica que funciona con cualquier adaptador.

#### Constructor
```typescript
new DataStorage<T>(adapter: StorageAdapter<T>)
```

#### Métodos

| Método | Parámetros | Retorna | Descripción |
|--------|------------|---------|-------------|
| `save` | `key: string, data: T` | `Promise<void>` | Guardar datos con una clave |
| `load` | `key: string` | `Promise<T \| null>` | Cargar datos por clave |
| `delete` | `key: string` | `Promise<void>` | Eliminar datos por clave |
| `clear` | - | `Promise<void>` | Limpiar todos los datos almacenados |
| `getAll` | - | `Promise<Record<string, T>>` | Obtener todos los datos almacenados |

### StringMapStorage

Almacenamiento especializado para pares clave-valor de strings.

#### Constructor
```typescript
new StringMapStorage(adapter?: StorageAdapter<StringMap>)
```

#### Métodos

| Método | Parámetros | Retorna | Descripción |
|--------|------------|---------|-------------|
| `setValue` | `key: string, value: string` | `Promise<void>` | Establecer un valor string |
| `getValue` | `key: string` | `Promise<string \| undefined>` | Obtener un valor string |
| `removeKey` | `key: string` | `Promise<void>` | Eliminar una clave |
| `getAll` | - | `Promise<StringMap>` | Obtener todos los pares clave-valor |

### ChatMemory & PersistentChatMemory

Almacenamiento de memoria de chat en memoria y persistente.

#### ChatMemory (En Memoria)
```typescript
const memory = new ChatMemory();
memory.addUserMessage("¡Hola!");
memory.addAIMessage("¡Hola! ¿Cómo estás?");
const messages = memory.getMessages();
```

#### PersistentChatMemory (Persistente)
```typescript
const memory = new PersistentChatMemory(
  new LocalStorageAdapter<Message[]>('chat-history')
);
memory.addUserMessage("¡Hola!");
```

| Método | Parámetros | Retorna | Descripción |
|--------|------------|---------|-------------|
| `addUserMessage` | `content: string, timestamp?: Date` | `void` | Agregar mensaje de usuario |
| `addAIMessage` | `content: string, timestamp?: Date` | `void` | Agregar mensaje de IA |
| `getMessages` | - | `Message[]` | Obtener todos los mensajes |
| `getLastMessages` | `count?: number` | `Message[]` | Obtener últimos N mensajes |
| `getMessagesSince` | `date: Date` | `Message[]` | Obtener mensajes desde fecha |
| `clear` | - | `void` | Limpiar todos los mensajes |
| `getMessagesAsync` | - | `Promise<Message[]>` | Obtener mensajes asíncronamente (PersistentChatMemory) |
| `reload` | - | `Promise<void>` | Recargar desde almacenamiento (PersistentChatMemory) |

## Adaptadores

### JSONFileAdapter (Node.js)

Adaptador de sistema de archivos usando archivos JSON.

#### Constructor
```typescript
new JSONFileAdapter<T>(filename: string)
```

#### Métodos

| Método | Parámetros | Retorna | Descripción |
|--------|------------|---------|-------------|
| `save` | `key: string, data: T` | `Promise<void>` | Guardar datos en archivo |
| `load` | `key: string` | `Promise<T \| null>` | Cargar datos desde archivo |
| `delete` | `key: string` | `Promise<void>` | Eliminar datos del archivo |
| `clear` | - | `Promise<void>` | Limpiar contenido del archivo |
| `getAll` | - | `Promise<Record<string, T>>` | Obtener todos los datos |
| `getFilePath` | - | `string` | Obtener ruta del archivo |

### LocalStorageAdapter (Navegador)

Adaptador de navegador usando localStorage.

#### Constructor
```typescript
new LocalStorageAdapter<T>(storageKey?: string)
```

#### Métodos

| Método | Parámetros | Retorna | Descripción |
|--------|------------|---------|-------------|
| `save` | `key: string, data: T` | `Promise<void>` | Guardar en localStorage |
| `load` | `key: string` | `Promise<T \| null>` | Cargar desde localStorage |
| `delete` | `key: string` | `Promise<void>` | Eliminar de localStorage |
| `clear` | - | `Promise<void>` | Limpiar todos los datos |
| `getAll` | - | `Promise<Record<string, T>>` | Obtener todos los datos |
| `getStorageKey` | - | `string` | Obtener clave de almacenamiento |
| `sync` | - | `void` | Sincronizar con localStorage |
| `destroy` | - | `void` | Eliminar de localStorage |

### InMemoryAdapter

Adaptador simple en memoria para pruebas.

## Tipos

### Message
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}
```

### StringMap
```typescript
type StringMap = Record<string, string>;
```

### StorageAdapter<T>
```typescript
interface StorageAdapter<T> {
  save(key: string, data: T): Promise<void>;
  load(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

## Ejemplos

### Operaciones CRUD Básicas
```typescript
import { DataStorage, LocalStorageAdapter } from 'json-obj-manager';

const storage = new DataStorage(new LocalStorageAdapter('app-data'));

// Crear
await storage.save('user-1', { name: 'Ana', age: 25 });

// Leer
const user = await storage.load('user-1');

// Actualizar
await storage.save('user-1', { name: 'Ana', age: 26 });

// Eliminar
await storage.delete('user-1');

// Obtener todo
const allData = await storage.getAll();
```

### Aplicación de Chat
```typescript
import { PersistentChatMemory, LocalStorageAdapter } from 'json-obj-manager';

const chat = new PersistentChatMemory(
  new LocalStorageAdapter<Message[]>('chat-app')
);

// Agregar mensajes
chat.addUserMessage("¿Cómo está el clima?");
chat.addAIMessage("Está soleado y a 24°C hoy.");

// Obtener historial de chat
const messages = chat.getMessages();
```