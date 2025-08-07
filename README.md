## Universal Storage Library

A flexible TypeScript storage library that works both in Node.js (file system) and browsers (localStorage) with a unified API.

### Installation

```bash
npm install json-obj-manager
```

### Basic Usage

#### Node.js (File System)
```typescript
import { DataStorage } from 'json-obj-manager';
import { JSONFileAdapter } from 'json-obj-manager/node';

import path from 'path';

const storage = new DataStorage(new JSONFileAdapter(path.join(process.cwd(), 'data.json')));
await storage.save('user-1', { name: 'John', age: 30 });
const user = await storage.load('user-1');
```

#### Browser (LocalStorage)
```typescript
import { DataStorage } from 'json-obj-manager';
import { LocalStorageAdapter } from 'json-obj-manager/browser';

const storage = new DataStorage(new LocalStorageAdapter('my-app'));
await storage.save('user-1', { name: 'John', age: 30 });
const user = await storage.load('user-1');
```

## Core Classes

### DataStorage<T>

Generic storage class that works with any adapter.

#### Constructor
```typescript
new DataStorage<T>(adapter: StorageAdapter<T>)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `save` | `key: string, data: T` | `Promise<void>` | Save data with a key |
| `load` | `key: string` | `Promise<T \| null>` | Load data by key |
| `delete` | `key: string` | `Promise<void>` | Delete data by key |
| `clear` | - | `Promise<void>` | Clear all stored data |
| `getAll` | - | `Promise<Record<string, T>>` | Get all stored data |
| `on` | `event: DataStorageEvents, listener: (data: T) => void` | `void` | Register an event listener |
| `off` | `event: DataStorageEvents, listener: (data: T) => void` | `void` | Remove an event listener |
| `setEmitMode` | `mode: EmitMode` | `void` | Set emit mode (info, debug, error, none) |



### StringMapStorage

Specialized storage for string key-value pairs.

#### Constructor
```typescript
new StringMapStorage(adapter?: StorageAdapter<StringMap>)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setValue` | `key: string, value: string` | `Promise<void>` | Set a string value |
| `getValue` | `key: string` | `Promise<string \| undefined>` | Get a string value |
| `removeKey` | `key: string` | `Promise<void>` | Remove a key |
| `getAll` | - | `Promise<StringMap>` | Get all key-value pairs |

### ChatMemory & PersistentChatMemory

In-memory and persistent chat memory storage.

#### ChatMemory (In-Memory)
```typescript
const memory = new ChatMemory();
memory.addUserMessage("Hello!");
memory.addAIMessage("Hi there!");
const messages = memory.getMessages();
```

#### PersistentChatMemory (Persistent)
```typescript
const memory = new PersistentChatMemory(
  new LocalStorageAdapter<Message[]>('chat-history')
);
memory.addUserMessage("Hello!");
```

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addUserMessage` | `content: string, timestamp?: Date` | `void` | Add user message |
| `addAIMessage` | `content: string, timestamp?: Date` | `void` | Add AI message |
| `getMessages` | - | `Message[]` | Get all messages |
| `getLastMessages` | `count?: number` | `Message[]` | Get last N messages |
| `getMessagesSince` | `date: Date` | `Message[]` | Get messages since date |
| `clear` | - | `void` | Clear all messages |
| `getMessagesAsync` | - | `Promise<Message[]>` | Async get messages (PersistentChatMemory) |
| `reload` | - | `Promise<void>` | Reload from storage (PersistentChatMemory) |

## Adapters

### JSONFileAdapter (Node.js)

File system adapter using JSON files.

#### Constructor
```typescript
new JSONFileAdapter<T>(filename: string)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `save` | `key: string, data: T` | `Promise<void>` | Save data to file |
| `load` | `key: string` | `Promise<T \| null>` | Load data from file |
| `delete` | `key: string` | `Promise<void>` | Delete data from file |
| `clear` | - | `Promise<void>` | Clear file contents |
| `getAll` | - | `Promise<Record<string, T>>` | Get all data |
| `getFilePath` | - | `string` | Get file path |

### LocalStorageAdapter (Browser)

Browser adapter using localStorage.

#### Constructor
```typescript
new LocalStorageAdapter<T>(storageKey?: string)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `save` | `key: string, data: T` | `Promise<void>` | Save to localStorage |
| `load` | `key: string` | `Promise<T \| null>` | Load from localStorage |
| `delete` | `key: string` | `Promise<void>` | Delete from localStorage |
| `clear` | - | `Promise<void>` | Clear all data |
| `getAll` | - | `Promise<Record<string, T>>` | Get all data |
| `getStorageKey` | - | `string` | Get storage key |
| `sync` | - | `void` | Sync with localStorage |
| `destroy` | - | `void` | Remove from localStorage |

### InMemoryAdapter

Simple in-memory adapter for testing.

## Types

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

## Examples

### Basic CRUD Operations
```typescript
import { DataStorage } from 'json-obj-manager';
import { LocalStorageAdapter } from 'json-obj-manager/browser';

const storage = new DataStorage(new LocalStorageAdapter('app-data'));

// Create
await storage.save('user-1', { name: 'Alice', age: 25 });

// Read
const user = await storage.load('user-1');

// Update
await storage.save('user-1', { name: 'Alice', age: 26 });

// Delete
await storage.delete('user-1');

// Get all
const allData = await storage.getAll();
```

### Chat Application
```typescript
import { PersistentChatMemory } from 'json-obj-manager';
import { LocalStorageAdapter } from 'json-obj-manager/browser';
import { Message } from 'json-obj-manager';

const chat = new PersistentChatMemory(
  new LocalStorageAdapter<Message[]>('chat-app')
);

// Add messages
chat.addUserMessage("What's the weather like?");
chat.addAIMessage("It's sunny and 75°F today.");

// Get chat history
const messages = chat.getMessages();
```