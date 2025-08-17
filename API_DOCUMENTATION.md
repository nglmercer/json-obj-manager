# JSON Object Manager - Complete API Documentation

[![npm version](https://badge.fury.io/js/json-obj-manager.svg)](https://badge.fury.io/js/json-obj-manager)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A comprehensive TypeScript storage library providing unified APIs for data persistence across Node.js, browsers, and in-memory scenarios.

## Table of Contents

- [Core Classes](#core-classes)
  - [DataStorage](#datastorage)
  - [StringMapStorage](#stringmapstorage)
  - [ChatMemory](#chatmemory)
  - [PersistentChatMemory](#persistentchatmemory)
  - [Emitter](#emitter)
- [Adapters](#adapters)
  - [JSONFileAdapter](#jsonfileadapter)
  - [LocalStorageAdapter](#localstorageadapter)
  - [InMemoryAdapter](#inmemoryadapter)
- [Types and Interfaces](#types-and-interfaces)
- [Events System](#events-system)
- [Advanced Usage](#advanced-usage)

## Core Classes

### DataStorage<T>

Generic storage class that provides a unified interface for data persistence.

#### Constructor
```typescript
new DataStorage<T>(adapter: StorageAdapter<T>)
```

**Parameters:**
- `adapter`: Storage adapter implementing the `StorageAdapter<T>` interface

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `emitMode` | `EmitMode` | Current event emission mode (getter/setter) |

#### Methods

##### save(key: string, data: T): Promise<void>
Saves data with the specified key.

**Parameters:**
- `key`: Unique identifier for the data
- `data`: Data to store

**Events Emitted:**
- `save`: When data is successfully saved

**Example:**
```typescript
const storage = new DataStorage<User>(adapter);
await storage.save('user-123', { name: 'John', age: 30 });
```

##### load(key: string): Promise<T | null>
Loads data by key.

**Parameters:**
- `key`: Unique identifier for the data

**Returns:**
- `Promise<T | null>`: The stored data or null if not found

**Events Emitted:**
- `load`: When data is successfully loaded

**Example:**
```typescript
const user = await storage.load('user-123');
if (user) {
  console.log(user.name);
}
```

##### delete(key: string): Promise<void>
Deletes data by key.

**Parameters:**
- `key`: Unique identifier for the data to delete

**Events Emitted:**
- `delete`: When data is successfully deleted

##### clear(): Promise<void>
Clears all stored data.

**Events Emitted:**
- `clear`: When all data is cleared

##### getAll(): Promise<Record<string, T>>
Retrieves all stored data.

**Returns:**
- `Promise<Record<string, T>>`: Object containing all stored key-value pairs

##### setEmitMode(mode: EmitMode): void
Sets the event emission mode.

**Parameters:**
- `mode`: One of `'all'`, `'info'`, `'debug'`, `'error'`, `'none'`

##### Event Methods

###### on(event: DataStorageEvents, listener: Function): void
Registers an event listener.

**Parameters:**
- `event`: Event name (`'save'`, `'load'`, `'delete'`, `'clear'`)
- `listener`: Function to call when event occurs

###### once(event: DataStorageEvents, listener: Function): void
Registers a one-time event listener.

###### off(event: DataStorageEvents, listener: Function): void
Removes an event listener.

### StringMapStorage

Specialized storage for string key-value pairs, extending DataStorage functionality.

#### Constructor
```typescript
new StringMapStorage(adapter?: StorageAdapter<StringMap>)
```

**Parameters:**
- `adapter`: Optional storage adapter. If not provided, uses InMemoryAdapter

#### Methods

##### setValue(key: string, value: string): Promise<void>
Sets a string value for the given key.

**Parameters:**
- `key`: The key to set
- `value`: The string value to store

**Example:**
```typescript
const config = new StringMapStorage();
await config.setValue('theme', 'dark');
await config.setValue('language', 'en');
```

##### getValue(key: string): Promise<string | undefined>
Gets a string value by key.

**Parameters:**
- `key`: The key to retrieve

**Returns:**
- `Promise<string | undefined>`: The stored value or undefined

##### removeKey(key: string): Promise<void>
Removes a key from the string map.

##### getStringMap(): Promise<StringMap>
Gets the complete string map.

**Returns:**
- `Promise<StringMap>`: Complete key-value map

##### getKeys(): Promise<string[]>
Gets all keys in the string map.

**Returns:**
- `Promise<string[]>`: Array of all keys

##### getValues(): Promise<string[]>
Gets all values in the string map.

**Returns:**
- `Promise<string[]>`: Array of all values

### ChatMemory

In-memory chat message storage with chronological ordering.

#### Constructor
```typescript
new ChatMemory()
```

#### Methods

##### addMessage(message: Message): void
Adds a message to the chat history.

**Parameters:**
- `message`: Message object with role, content, and optional timestamp

##### addUserMessage(content: string, timestamp?: Date): void
Adds a user message.

**Parameters:**
- `content`: Message content
- `timestamp`: Optional timestamp (defaults to current time)

##### addAIMessage(content: string, timestamp?: Date): void
Adds an AI/assistant message.

##### getMessages(): Message[]
Gets all messages in chronological order.

**Returns:**
- `Message[]`: Array of all messages

##### getLastMessages(count?: number): Message[]
Gets the last N messages.

**Parameters:**
- `count`: Number of messages to retrieve (default: 10)

**Returns:**
- `Message[]`: Array of recent messages

##### getAllMessages(): Message[]
Alias for getMessages().

##### getMessagesSince(date: Date): Message[]
Gets messages since a specific date.

**Parameters:**
- `date`: Date threshold

**Returns:**
- `Message[]`: Messages after the specified date

##### clear(): void
Clears all messages from memory.

### PersistentChatMemory

Extends ChatMemory with persistent storage capabilities.

#### Constructor
```typescript
new PersistentChatMemory(adapter: StorageAdapter<Message[]>)
```

**Parameters:**
- `adapter`: Storage adapter for message persistence

#### Additional Methods

##### saveMessages(): Promise<void>
Saves current messages to persistent storage.

##### loadMessages(): Promise<void>
Loads messages from persistent storage.

##### addMessageAndSave(message: Message): Promise<void>
Adds a message and immediately saves to storage.

**Parameters:**
- `message`: Message to add and save

### Emitter

Powerful event emitter with advanced listener management.

#### Constructor
```typescript
new Emitter()
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `maxListeners` | `number` | Maximum listeners per event (default: 10) |

#### Methods

##### on(event: string, callback: Function): () => void
Registers an event listener.

**Parameters:**
- `event`: Event name
- `callback`: Function to execute when event is emitted

**Returns:**
- `() => void`: Function to unregister the listener

**Example:**
```typescript
const emitter = new Emitter();
const unsubscribe = emitter.on('userLogin', (userData) => {
  console.log('User logged in:', userData);
});

// Later...
unsubscribe(); // Remove the listener
```

##### once(event: string, callback: Function): () => void
Registers a one-time event listener.

##### onAny(callback: (event: string, data: any) => void): () => void
Registers a listener for any event.

**Parameters:**
- `callback`: Function that receives event name and data

##### onceAny(callback: (event: string, data: any) => void): () => void
Registers a one-time listener for any event.

##### emit(event: string, data?: any): boolean
Emits an event to all registered listeners.

**Parameters:**
- `event`: Event name
- `data`: Optional data to send to listeners

**Returns:**
- `boolean`: True if there were listeners for the event

##### emitAsync(event: string, data?: any): Promise<boolean>
Asynchronous version of emit.

**Returns:**
- `Promise<boolean>`: Promise resolving to true if there were listeners

##### off(event: string, callback: Function): void
Removes a specific event listener.

##### removeAllListeners(event?: string): void
Removes all listeners for an event or all events.

**Parameters:**
- `event`: Optional event name. If not provided, removes all listeners

##### listenerCount(event: string): number
Gets the number of listeners for an event.

**Returns:**
- `number`: Number of registered listeners

##### eventNames(): string[]
Gets names of all events with listeners.

**Returns:**
- `string[]`: Array of event names

##### setMaxListeners(n: number): void
Sets the maximum number of listeners per event.

##### getMaxListeners(): number
Gets the current maximum listeners limit.

##### getListeners(event: string): Function[]
Gets all listeners for a specific event.

##### getAnyListeners(): Function[]
Gets all "any" event listeners.

##### prependListener(event: string, callback: Function): () => void
Adds a listener to the beginning of the listeners array.

##### prependOnceListener(event: string, callback: Function): () => void
Adds a one-time listener to the beginning of the listeners array.

##### debug(): object
Returns debugging information about the emitter state.

**Returns:**
- Object with statistics about events, listeners, and memory usage

##### destroy(): void
Clears all listeners and frees memory.

##### hasListeners(event: string): boolean
Checks if an event has any listeners.

**Returns:**
- `boolean`: True if the event has listeners

## Adapters

### JSONFileAdapter<T>

File system adapter for Node.js environments.

#### Constructor
```typescript
new JSONFileAdapter<T>(filename: string)
```

**Parameters:**
- `filename`: Path to the JSON file for storage

#### Methods

##### ensureFileExists(): Promise<void>
Ensures the storage file exists, creating it if necessary.

##### readFile(): Promise<Record<string, T>>
Reads and parses the JSON file.

##### writeFile(data: Record<string, T>): Promise<void>
Writes data to the JSON file.

##### getFilePath(): string
Gets the file path being used for storage.

##### invalidateCache(): void
Invalidates the internal cache, forcing next read from disk.

### LocalStorageAdapter<T>

Browser localStorage adapter.

#### Constructor
```typescript
new LocalStorageAdapter<T>(storageKey?: string)
```

**Parameters:**
- `storageKey`: Optional key for localStorage (default: 'json-obj-manager')

#### Methods

##### getStorageKey(): string
Gets the localStorage key being used.

##### sync(): void
Synchronizes with localStorage (useful for cross-tab updates).

##### destroy(): void
Completely removes data from localStorage.

##### getUsageInfo(): object
Gets storage usage statistics.

**Returns:**
- Object with size information and storage availability

### InMemoryAdapter<T>

Simple in-memory storage adapter, perfect for testing.

#### Constructor
```typescript
new InMemoryAdapter<T>()
```

## Types and Interfaces

### StorageAdapter<T>

Base interface that all storage adapters must implement.

```typescript
interface StorageAdapter<T> {
  save(key: string, data: T): Promise<void>;
  load(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll?(): Promise<Record<string, T>>; // Optional method
}
```

### ExtendedStorageAdapter<T>

Extended interface with additional optional methods.

```typescript
interface ExtendedStorageAdapter<T> extends StorageAdapter<T> {
  getAll(): Promise<Record<string, T>>;
  // Additional adapter-specific methods
}
```

### Message

Interface for chat messages.

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}
```

### StringMap

Type for string key-value pairs.

```typescript
type StringMap = Record<string, string>;
```

### AllowedData

Union type for supported data types.

```typescript
type AllowedData = string | number | boolean | object | null | undefined;
```

### MemoryStore

Interface for memory storage operations.

```typescript
interface MemoryStore {
  addUserMessage(content: string, timestamp?: Date): void;
  addAIMessage(content: string, timestamp?: Date): void;
  getMessages(): Message[];
  getLastMessages(count?: number): Message[];
  clear(): void;
}
```

### EmitMode

Event emission modes for DataStorage.

```typescript
type EmitMode = 'all' | 'info' | 'debug' | 'error' | 'none';
```

### DataStorageEvents

Available events for DataStorage.

```typescript
type DataStorageEvents = 'save' | 'load' | 'delete' | 'clear';
```

## Events System

The library includes a comprehensive event system for monitoring storage operations and implementing reactive patterns.

### Event Emission Modes

- **`'all'`**: Emits all data changes (default)
- **`'info'`**: Emits informational events
- **`'debug'`**: Emits debug-level events
- **`'error'`**: Only emits error events
- **`'none'`**: No event emission

### Event Handling Example

```typescript
const storage = new DataStorage(adapter);
storage.setEmitMode('info');

// Listen to all storage operations
storage.on('save', (data) => {
  console.log('Data saved:', data);
});

storage.on('load', (data) => {
  console.log('Data loaded:', data);
});

storage.on('delete', (key) => {
  console.log('Data deleted:', key);
});

storage.on('clear', () => {
  console.log('Storage cleared');
});
```

## Advanced Usage

### Custom Adapter Implementation

```typescript
class CustomAdapter<T> implements StorageAdapter<T> {
  private data = new Map<string, T>();

  async save(key: string, data: T): Promise<void> {
    this.data.set(key, data);
    // Custom logic here
  }

  async load(key: string): Promise<T | null> {
    return this.data.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async getAll(): Promise<Record<string, T>> {
    const result: Record<string, T> = {};
    for (const [key, value] of this.data) {
      result[key] = value;
    }
    return result;
  }
}
```

### Type-Safe Storage

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const userStorage = new DataStorage<UserProfile>(adapter);

// TypeScript ensures type safety
await userStorage.save('user-1', {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
    notifications: true
  }
});
```

### Event-Driven Architecture

```typescript
class UserService {
  private storage: DataStorage<UserProfile>;
  private emitter: Emitter;

  constructor(adapter: StorageAdapter<UserProfile>) {
    this.storage = new DataStorage(adapter);
    this.emitter = new Emitter();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.storage.on('save', (user) => {
      this.emitter.emit('userUpdated', user);
    });

    this.storage.on('delete', (userId) => {
      this.emitter.emit('userDeleted', userId);
    });
  }

  async createUser(user: UserProfile): Promise<void> {
    await this.storage.save(user.id, user);
    this.emitter.emit('userCreated', user);
  }

  onUserEvent(event: string, callback: Function): () => void {
    return this.emitter.on(event, callback);
  }
}
```

### Utility Functions

The library provides convenient factory functions:

```typescript
import { createMemory, createStringMap } from 'json-obj-manager';

// Create in-memory chat
const chat = createMemory();

// Create in-memory string map
const config = createStringMap();
```

---

**For more examples and advanced usage patterns, see the main README.md file.**