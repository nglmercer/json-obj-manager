# JSON Object Manager

[![npm version](https://badge.fury.io/js/json-obj-manager.svg)](https://badge.fury.io/js/json-obj-manager)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A powerful, flexible TypeScript storage library that provides a unified API for data persistence across different environments. Works seamlessly in Node.js (file system), browsers (localStorage), and in-memory scenarios.

## ✨ Features

- 🔄 **Universal API**: Same interface for Node.js, browser, and in-memory storage
- 📝 **TypeScript First**: Full type safety and IntelliSense support
- 🔌 **Adapter Pattern**: Easily extensible with custom storage adapters
- 💬 **Chat Memory**: Built-in chat message management with persistence
- 🗂️ **String Maps**: Specialized key-value storage for configuration
- 📡 **Event System**: Real-time notifications for data changes
- 🧪 **Testing Ready**: In-memory adapter perfect for unit tests
- 🚀 **Zero Dependencies**: Lightweight and fast

## 📦 Installation

```bash
npm install json-obj-manager
```

```bash
yarn add json-obj-manager
```

```bash
pnpm add json-obj-manager
```

## 🚀 Quick Start

### Node.js (File System)
```typescript
import { DataStorage } from 'json-obj-manager';
import { JSONFileAdapter } from 'json-obj-manager/node';
import path from 'path';

// Define your data type
interface User {
  name: string;
  age: number;
  email: string;
}

// Create storage with type safety
const userStorage = new DataStorage<User>(
  new JSONFileAdapter(path.join(process.cwd(), 'users.json'))
);

// Save and load data
await userStorage.save('user-1', { 
  name: 'John Doe', 
  age: 30, 
  email: 'john@example.com' 
});

const user = await userStorage.load('user-1');
console.log(user); // { name: 'John Doe', age: 30, email: 'john@example.com' }
```

### Browser (LocalStorage)
```typescript
import { DataStorage } from 'json-obj-manager';
import { LocalStorageAdapter } from 'json-obj-manager/browser';

interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

const settingsStorage = new DataStorage<AppSettings>(
  new LocalStorageAdapter('my-app-settings')
);

await settingsStorage.save('config', {
  theme: 'dark',
  language: 'en',
  notifications: true
});

const settings = await settingsStorage.load('config');
```

### In-Memory (Testing)
```typescript
import { DataStorage, InMemoryAdapter } from 'json-obj-manager';

// Perfect for unit tests
const testStorage = new DataStorage<any>(new InMemoryAdapter());

await testStorage.save('test-data', { value: 'test' });
const data = await testStorage.load('test-data');
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

## 📚 Examples

### Basic CRUD Operations
```typescript
import { DataStorage } from 'json-obj-manager';
import { LocalStorageAdapter } from 'json-obj-manager/browser';

interface User {
  id: string;
  name: string;
  age: number;
  preferences: {
    theme: string;
    language: string;
  };
}

const userStorage = new DataStorage<User>(new LocalStorageAdapter('users'));

// Create
await userStorage.save('user-1', {
  id: 'user-1',
  name: 'Alice Johnson',
  age: 25,
  preferences: {
    theme: 'dark',
    language: 'en'
  }
});

// Read
const user = await userStorage.load('user-1');
console.log(user?.name); // 'Alice Johnson'

// Update
if (user) {
  user.age = 26;
  await userStorage.save('user-1', user);
}

// Delete
await userStorage.delete('user-1');

// Get all users
const allUsers = await userStorage.getAll();
console.log(Object.keys(allUsers)); // ['user-2', 'user-3', ...]
```

### Chat Application with Persistence
```typescript
import { PersistentChatMemory, createMemory } from 'json-obj-manager';
import { JSONFileAdapter } from 'json-obj-manager/node';
import { Message } from 'json-obj-manager';

// Persistent chat (saves to file)
const persistentChat = new PersistentChatMemory(
  new JSONFileAdapter('./chat-history.json')
);

// In-memory chat (for temporary sessions)
const sessionChat = createMemory();

// Add messages with timestamps
persistentChat.addUserMessage("What's the weather like?", new Date());
persistentChat.addAIMessage("It's sunny and 75°F today.", new Date());
persistentChat.addUserMessage("Great! Any chance of rain?");
persistentChat.addAIMessage("No rain expected for the next 3 days.");

// Get recent conversation
const lastMessages = persistentChat.getLastMessages(3);
console.log(lastMessages.map(m => `${m.role}: ${m.content}`));

// Get messages since yesterday
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recentMessages = persistentChat.getMessagesSince(yesterday);

// Auto-save feature
persistentChat.setAutoSave(true); // Automatically saves after each message
```

### Configuration Management
```typescript
import { StringMapStorage, createStringMap } from 'json-obj-manager';
import { LocalStorageAdapter } from 'json-obj-manager/browser';

// Browser configuration
const appConfig = new StringMapStorage(
  new LocalStorageAdapter('app-config')
);

// Set configuration values
await appConfig.setValue('api_endpoint', 'https://api.example.com');
await appConfig.setValue('max_retries', '3');
await appConfig.setValue('timeout', '5000');
await appConfig.setValue('debug_mode', 'false');

// Get configuration
const apiEndpoint = await appConfig.getValue('api_endpoint');
const maxRetries = parseInt(await appConfig.getValue('max_retries') || '1');
const isDebug = (await appConfig.getValue('debug_mode')) === 'true';

// Get all configuration
const allConfig = await appConfig.getAll();
console.log('Current configuration:', allConfig);

// Simple in-memory config (no persistence)
const tempConfig = createStringMap();
await tempConfig.setValue('session_id', 'abc123');
```

### Event-Driven Storage
```typescript
import { DataStorage } from 'json-obj-manager';
import { JSONFileAdapter } from 'json-obj-manager/node';

const storage = new DataStorage(new JSONFileAdapter('./data.json'));

// Enable event emissions
storage.setEmitMode('info');

// Listen to storage events
storage.on('save', (data) => {
  console.log('Data saved:', data);
});

storage.on('load', (data) => {
  console.log('Data loaded:', data);
});

storage.on('delete', (data) => {
  console.log('Data deleted:', data);
});

storage.on('clear', () => {
  console.log('Storage cleared');
});

// These operations will trigger events
await storage.save('item-1', { name: 'Test Item' });
const item = await storage.load('item-1');
await storage.delete('item-1');
```

### Custom Adapter Implementation
```typescript
import { StorageAdapter } from 'json-obj-manager';

// Example: Redis adapter
class RedisAdapter<T> implements StorageAdapter<T> {
  constructor(private redisClient: any, private keyPrefix: string = '') {}

  async save(key: string, data: T): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;
    await this.redisClient.set(fullKey, JSON.stringify(data));
  }

  async load(key: string): Promise<T | null> {
    const fullKey = `${this.keyPrefix}${key}`;
    const data = await this.redisClient.get(fullKey);
    return data ? JSON.parse(data) : null;
  }

  async delete(key: string): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;
    await this.redisClient.del(fullKey);
  }

  async clear(): Promise<void> {
    const keys = await this.redisClient.keys(`${this.keyPrefix}*`);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }

  async getAll(): Promise<Record<string, T>> {
    const keys = await this.redisClient.keys(`${this.keyPrefix}*`);
    const result: Record<string, T> = {};
    
    for (const fullKey of keys) {
      const key = fullKey.replace(this.keyPrefix, '');
      const data = await this.redisClient.get(fullKey);
      if (data) {
        result[key] = JSON.parse(data);
      }
    }
    
    return result;
  }
}

// Usage
const redisStorage = new DataStorage(new RedisAdapter(redisClient, 'myapp:'));
```

## 🧪 Testing

The library includes comprehensive Jest tests. Run them with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Your Code

Use the `InMemoryAdapter` for testing your applications:

```typescript
import { DataStorage, InMemoryAdapter } from 'json-obj-manager';

describe('User Service', () => {
  let userStorage: DataStorage<User>;

  beforeEach(() => {
    // Fresh storage for each test
    userStorage = new DataStorage(new InMemoryAdapter());
  });

  test('should create user', async () => {
    const user = { name: 'Test User', age: 25 };
    await userStorage.save('user-1', user);
    
    const savedUser = await userStorage.load('user-1');
    expect(savedUser).toEqual(user);
  });
});
```

## 🏗️ Architecture

### Adapter Pattern

The library uses the adapter pattern to provide a consistent interface across different storage backends:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your App      │───▶│   DataStorage    │───▶│  StorageAdapter │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
                ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
                │ JSONFileAdapter │              │LocalStorageAdapter│            │ InMemoryAdapter │
                │   (Node.js)     │              │   (Browser)     │              │   (Testing)     │
                └─────────────────┘              └─────────────────┘              └─────────────────┘
```

### Type Safety

Full TypeScript support ensures type safety across all operations:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

const productStorage = new DataStorage<Product>(adapter);

// ✅ Type-safe operations
await productStorage.save('prod-1', {
  id: 'prod-1',
  name: 'Laptop',
  price: 999.99,
  inStock: true
});

// ✅ IntelliSense support
const product = await productStorage.load('prod-1');
if (product) {
  console.log(product.name); // TypeScript knows this is a string
  console.log(product.price); // TypeScript knows this is a number
}
```

## 🔧 Best Practices

### 1. Use Type Definitions

Always define interfaces for your data:

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const userStorage = new DataStorage<User>(adapter);

// ❌ Avoid
const userStorage = new DataStorage<any>(adapter);
```

### 2. Handle Errors Gracefully

```typescript
try {
  const user = await userStorage.load('user-1');
  if (!user) {
    console.log('User not found');
    return;
  }
  // Process user...
} catch (error) {
  console.error('Failed to load user:', error);
}
```

### 3. Use Events for Monitoring

```typescript
storage.setEmitMode('info');
storage.on('save', (data) => {
  console.log('Data saved:', Object.keys(data).length, 'items');
});
```

### 4. Organize Storage by Domain

```typescript
// Separate storage instances for different data types
const userStorage = new DataStorage<User>(new JSONFileAdapter('./data/users.json'));
const productStorage = new DataStorage<Product>(new JSONFileAdapter('./data/products.json'));
const orderStorage = new DataStorage<Order>(new JSONFileAdapter('./data/orders.json'));
```

### 5. Use Appropriate Adapters

- **JSONFileAdapter**: Server-side applications, desktop apps
- **LocalStorageAdapter**: Browser applications, client-side storage
- **InMemoryAdapter**: Testing, temporary data, caching

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/nglmercer/json-obj-manager.git
cd json-obj-manager

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript for maximum developer experience
- Inspired by the need for universal storage solutions
- Thanks to all contributors and users of this library

---

**Made with ❤️ by [memelser](https://github.com/nglmercer)**
```