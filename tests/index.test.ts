import { 
  createMemory, 
  createStringMap, 
  StringMapStorage, 
  ChatMemory,
  DataStorage,
  InMemoryAdapter
} from '../src/index';

describe('ChatMemory', () => {
  let memory: ChatMemory;

  beforeEach(() => {
    memory = createMemory() as ChatMemory;
  });

  describe('Basic message operations', () => {
    test('should add user and AI messages correctly', () => {
      memory.addUserMessage('Hello AI');
      memory.addAIMessage('Hello human');
      
      const messages = memory.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        role: 'user',
        content: 'Hello AI',
        timestamp: undefined
      });
      expect(messages[1]).toEqual({
        role: 'assistant',
        content: 'Hello human',
        timestamp: undefined
      });
    });

    test('should handle messages without timestamps', () => {
      memory.addUserMessage('Test message without timestamp');
      memory.addAIMessage('Response without timestamp');
      
      const messages = memory.getMessages();
      messages.forEach(msg => {
        expect(msg.timestamp).toBeUndefined();
      });
      
      // getMessagesSince should return all messages if no date
      const allMessages = memory.getMessagesSince(new Date());
      expect(allMessages).toHaveLength(2);
    });
  });

  describe('Last N messages functionality', () => {
    beforeEach(() => {
      // Add 5 pairs of messages
      for (let i = 0; i < 5; i++) {
        memory.addUserMessage(`User ${i}`);
        memory.addAIMessage(`AI ${i}`);
      }
    });

    test('should get last N messages correctly', () => {
      const last3 = memory.getLastMessages(3);
      expect(last3).toHaveLength(3);
      
      // Should return the last 3 messages in chronological order
      const contents = last3.map(m => m.content);
      expect(contents).toEqual(['AI 3', 'User 4', 'AI 4']);
    });

    test('should handle last N messages with timestamps', () => {
      const memoryWithTimestamps = createMemory() as ChatMemory;
      
      for (let i = 0; i < 5; i++) {
        memoryWithTimestamps.addUserMessage(`User ${i}`, new Date());
        memoryWithTimestamps.addAIMessage(`AI ${i}`, new Date());
      }
      
      const last3 = memoryWithTimestamps.getLastMessages(3);
      const contents = last3.map(m => m.content);
      expect(contents).toEqual(['AI 3', 'User 4', 'AI 4']);
    });
  });
});

describe('StringMapStorage', () => {
  let storage: StringMapStorage;

  beforeEach(() => {
    storage = createStringMap();
  });

  describe('Basic operations', () => {
    test('should set and get values correctly', async () => {
      await storage.setValue('key1', 'value1');
      const value = await storage.getValue('key1');
      expect(value).toBe('value1');
    });

    test('should overwrite existing key values', async () => {
      await storage.setValue('key', 'original');
      await storage.setValue('key', 'updated');
      
      const value = await storage.getValue('key');
      expect(value).toBe('updated');
    });

    test('should return all key-value pairs', async () => {
      await storage.setValue('key1', 'value1');
      await storage.setValue('key2', 'value2');
      
      const all = await storage.getStringMap();
      expect(all).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    test('should clear all data', async () => {
      await storage.setValue('key1', 'value1');
      await storage.setValue('key2', 'value2');
      
      await storage.clear();
      const empty = await storage.getAll();
      expect(Object.keys(empty)).toHaveLength(0);
    });
  });

  describe('Instance isolation', () => {
    test('should maintain separate data between instances', async () => {
      const storage1 = createStringMap();
      const storage2 = createStringMap();
      
      await storage1.setValue('key', 'value1');
      await storage2.setValue('key', 'value2');
      
      const val1 = await storage1.getValue('key');
      const val2 = await storage2.getValue('key');
      
      expect(val1).toBe('value1');
      expect(val2).toBe('value2');
    });
  });
});

describe('DataStorage', () => {
  describe('Number storage', () => {
    let storage: DataStorage<number>;

    beforeEach(() => {
      storage = new DataStorage<number>(new InMemoryAdapter<number>());
    });

    test('should store and retrieve numbers', async () => {
      await storage.save('count', 42);
      const value = await storage.load('count');
      expect(value).toBe(42);
    });

    test('should delete stored numbers', async () => {
      await storage.save('count', 42);
      await storage.delete('count');
      const deleted = await storage.load('count');
      expect(deleted).toBeNull();
    });
  });

  describe('Object storage', () => {
    let storage: DataStorage<object>;

    beforeEach(() => {
      storage = new DataStorage<object>(new InMemoryAdapter<object>());
    });

    test('should store and retrieve complex objects', async () => {
      const testObj = { 
        name: 'Test', 
        nested: { value: 123 },
        array: [1, 2, 3]
      };
      
      await storage.save('object', testObj);
      const retrieved = await storage.load('object');
      expect(retrieved).toEqual(testObj);
    });
  });

  describe('String storage', () => {
    let storage: DataStorage<string>;

    beforeEach(() => {
      storage = new DataStorage<string>(new InMemoryAdapter<string>());
    });

    test('should clear all stored data', async () => {
      await storage.save('key1', 'value1');
      await storage.save('key2', 'value2');
      
      await storage.clear();
      const val1 = await storage.load('key1');
      const val2 = await storage.load('key2');
      
      expect(val1).toBeNull();
      expect(val2).toBeNull();
    });

    test('should enforce type constraints', async () => {
      await storage.save('test', 'string value');
      const value = await storage.load('test');
      expect(typeof value).toBe('string');
    });
  });
});