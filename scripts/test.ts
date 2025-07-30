// tests/index.test.ts
import { mkdir, access, writeFile } from 'fs/promises';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { 
  createMemory, 
  createStringMap, 
  StringMapStorage, 
  ChatMemory,
  DataStorage,
  InMemoryAdapter
} from '../src/index';

/**
 * Utility to color console output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test runner
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<boolean> }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => Promise<boolean>) {
    this.tests.push({ name, fn });
  }

  async run() {
    log('\n🧪 Running Tests...\n', 'bright');
    
    for (const { name, fn } of this.tests) {
      try {
        const result = await fn();
        if (result) {
          log(`✅ ${name}`, 'green');
          this.passed++;
        } else {
          log(`❌ ${name}`, 'red');
          this.failed++;
        }
      } catch (error) {
        log(`❌ ${name} - Error: ${error.message}`, 'red');
        this.failed++;
      }
    }

    log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`, 'bright');
  }
}

// Test assertions
function assertEquals(actual: any, expected: any, message?: string): boolean {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  return true;
}

function assertTrue(condition: boolean, message?: string): boolean {
  if (!condition) {
    throw new Error(message || 'Expected true, got false');
  }
  return true;
}

// Tests
const runner = new TestRunner();

// Test 1: ChatMemory - get last N messages (CORREGIDO)
runner.test('ChatMemory - get last N messages', async () => {
  const memory = createMemory() as ChatMemory;
  
  for (let i = 0; i < 5; i++) {
    memory.addUserMessage(`User ${i}`);
    memory.addAIMessage(`AI ${i}`);
  }
  
  const last3 = memory.getLastMessages(3);
  assertEquals(last3.length, 3);
  assertEquals(last3[0].content, 'AI 3'); // El último mensaje es AI 4
  assertEquals(last3[1].content, 'User 4'); // El penúltimo es User 4
  assertEquals(last3[2].content, 'AI 4'); // El antepenúltimo es AI 3
  
  return true;
});

// Test 2: StringMapStorage - getAll returns all key-value pairs
runner.test('StringMapStorage - getAll returns all key-value pairs', async () => {
  const storage = createStringMap();
  
  await storage.setValue('key1', 'value1');
  await storage.setValue('key2', 'value2');
  
  const all = await storage.getAll();
  assertEquals(all['key1'], 'value1');
  assertEquals(all['key2'], 'value2');
  
  await storage.clear();
  const empty = await storage.getAll();
  assertEquals(Object.keys(empty).length, 0);
  
  return true;
});

// Test 3: ChatMemory - add and get messages (CORREGIDO)
runner.test('ChatMemory - add user and AI messages', async () => {
  const memory = createMemory() as ChatMemory;
  
  memory.addUserMessage('Hello AI');
  memory.addAIMessage('Hello human');
  
  const messages = memory.getMessages();
  assertEquals(messages.length, 2);
  assertEquals(messages[0].role, 'user');
  assertEquals(messages[0].content, 'Hello AI');
  
  assertEquals(messages[1].role, 'assistant');
  assertEquals(messages[1].content, 'Hello human');
  
  return true;
});

// Test 4: ChatMemory - get last N messages with timestamps (CORREGIDO)
runner.test('ChatMemory - get last N messages with timestamps', async () => {
  const memory = createMemory() as ChatMemory;
  
  for (let i = 0; i < 5; i++) {
    memory.addUserMessage(`User ${i}`, new Date());
    memory.addAIMessage(`AI ${i}`, new Date());
  }
  
  const last3 = memory.getLastMessages(3);
  const expected = ['AI 3', 'User 4', 'AI 4'];
  const actual = last3.map(m => m.content);
  
  assertEquals(actual, expected);
  
  return true;
});

// Test 5: DataStorage with numbers
runner.test('DataStorage - store and retrieve numbers', async () => {
  const storage = new DataStorage<number>(new InMemoryAdapter<number>());
  
  await storage.save('count', 42);
  const value = await storage.load('count');
  assertEquals(value, 42);
  
  await storage.delete('count');
  const deleted = await storage.load('count');
  assertEquals(deleted, null);
  
  return true;
});

// Test 6: DataStorage with objects
runner.test('DataStorage - store and retrieve complex objects', async () => {
  const storage = new DataStorage<object>(new InMemoryAdapter<object>());
  
  const testObj = { 
    name: 'Test', 
    nested: { value: 123 },
    array: [1, 2, 3]
  };
  
  await storage.save('object', testObj);
  const retrieved = await storage.load('object');
  assertEquals(retrieved, testObj);
  
  return true;
});

// Test 7: DataStorage - clear all
runner.test('DataStorage - clear all stored data', async () => {
  const storage = new DataStorage<string>(new InMemoryAdapter<string>());
  
  await storage.save('key1', 'value1');
  await storage.save('key2', 'value2');
  
  await storage.clear();
  const val1 = await storage.load('key1');
  const val2 = await storage.load('key2');
  
  assertEquals(val1, null);
  assertEquals(val2, null);
  
  return true;
});

// Test 8: ChatMemory - messages work without timestamps (CORREGIDO)
runner.test('ChatMemory - messages work without timestamps', async () => {
  const memory = createMemory() as ChatMemory;
  
  memory.addUserMessage('Test message without timestamp');
  memory.addAIMessage('Response without timestamp');
  
  const messages = memory.getMessages();
  
  // Verificar que no hay timestamps
  messages.forEach(msg => {
    assertEquals(msg.timestamp, undefined);
  });
  
  // getMessagesSince debería devolver todos los mensajes si no hay fecha
  const allMessages = memory.getMessagesSince(new Date());
  assertEquals(allMessages.length, 2);
  
  return true;
});

// Test 9: StringMapStorage - overwrite existing key
runner.test('StringMapStorage - overwrite existing key value', async () => {
  const storage = createStringMap();
  
  await storage.setValue('key', 'original');
  await storage.setValue('key', 'updated');
  
  const value = await storage.getValue('key');
  assertEquals(value, 'updated');
  
  return true;
});

// Test 10: Type safety with DataStorage
runner.test('DataStorage - enforce type constraints', async () => {
  const storage = new DataStorage<string>(new InMemoryAdapter<string>());
  
  // This should work
  await storage.save('test', 'string value');
  const value = await storage.load('test');
  assertEquals(typeof value, 'string');
  
  return true;
});

// Test 11: Multiple StringMap instances isolation
runner.test('StringMapStorage - instances are isolated', async () => {
  const storage1 = createStringMap();
  const storage2 = createStringMap();
  
  await storage1.setValue('key', 'value1');
  await storage2.setValue('key', 'value2');
  
  const val1 = await storage1.getValue('key');
  const val2 = await storage2.getValue('key');
  
  assertEquals(val1, 'value1');
  assertEquals(val2, 'value2');
  
  return true;
});

// Run all tests
runner.run().catch(console.error);