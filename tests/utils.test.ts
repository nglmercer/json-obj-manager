import { Emitter } from '../src/utils/Emitter';
import { ChatMemory, PersistentChatMemory } from '../src/utils/memory';
import { StringMapStorage } from '../src/utils/string-map-storage';
import { InMemoryAdapter } from '../src/core/storage';

describe('Emitter', () => {
  let emitter: Emitter;

  beforeEach(() => {
    emitter = new Emitter();
  });

  test('should register and trigger event listeners', () => {
    const mockCallback = jest.fn();
    const testData = { test: 'data' };
    
    emitter.on('test-event', mockCallback);
    emitter.emit('test-event', testData);
    
    expect(mockCallback).toHaveBeenCalledWith(testData);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should support multiple listeners for same event', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const testData = { test: 'data' };
    
    emitter.on('test-event', callback1);
    emitter.on('test-event', callback2);
    emitter.emit('test-event', testData);
    
    expect(callback1).toHaveBeenCalledWith(testData);
    expect(callback2).toHaveBeenCalledWith(testData);
  });

  test('should remove specific event listeners', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    emitter.on('test-event', callback1);
    emitter.on('test-event', callback2);
    emitter.off('test-event', callback1);
    
    emitter.emit('test-event', { test: 'data' });
    
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  test('should handle events with no listeners gracefully', () => {
    expect(() => {
      emitter.emit('non-existent-event', { test: 'data' });
    }).not.toThrow();
  });

  test('should support once listeners', () => {
    const mockCallback = jest.fn();
    
    emitter.once('test-event', mockCallback);
    
    emitter.emit('test-event', { first: 'call' });
    emitter.emit('test-event', { second: 'call' });
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith({ first: 'call' });
  });

  test('should remove all listeners for an event', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    emitter.on('test-event', callback1);
    emitter.on('test-event', callback2);
    emitter.removeAllListeners('test-event');
    
    emitter.emit('test-event', { test: 'data' });
    
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
});

describe('PersistentChatMemory', () => {
  let adapter: InMemoryAdapter<any>;
  let memory: PersistentChatMemory;

  beforeEach(() => {
    adapter = new InMemoryAdapter<any>();
    memory = new PersistentChatMemory(adapter);
  });

  test('should persist messages to adapter', async () => {
    memory.addUserMessage('Hello');
    memory.addAIMessage('Hi there');

    // Messages are saved automatically
    const savedData = await adapter.load('chat-memory');
    expect(savedData).toHaveLength(2);
    expect(savedData[0]).toMatchObject({
      role: 'user',
      content: 'Hello'
    });
    expect(savedData[1]).toMatchObject({
      role: 'assistant',
      content: 'Hi there'
    });
  });

  test('should load messages from adapter', async () => {
    const existingMessages = [
      { role: 'user', content: 'Previous message' },
      { role: 'assistant', content: 'Previous response' }
    ];
    
    await adapter.save('chat-memory', existingMessages);
    await memory.loadMessages();
    
    const messages = memory.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('Previous message');
    expect(messages[1].content).toBe('Previous response');
  });

  test('should save messages automatically on add', async () => {
    memory.addUserMessage('Auto save test');
    memory.addAIMessage('Auto save response');

    // Verify messages were saved automatically
    const savedData = await adapter.load('chat-memory');
    expect(savedData).toHaveLength(2);
    expect(savedData[0].content).toBe('Auto save test');
    expect(savedData[1].content).toBe('Auto save response');
  });

  test('should get messages asynchronously', async () => {
    memory.addUserMessage('Async test');
    memory.addAIMessage('Async response');
    
    const messages = await memory.getMessagesAsync();
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('Async test');
    expect(messages[1].content).toBe('Async response');
  });

  test('should clear messages and persist', async () => {
    memory.addUserMessage('To be cleared');
    await memory.saveMessages();
    
    memory.clear();
    
    const newMemory = new PersistentChatMemory(adapter);
    await newMemory.loadMessages();
    
    expect(newMemory.getMessages()).toHaveLength(0);
  });

  test('should handle messages correctly', async () => {
    memory.addUserMessage('Test message');

    const messages = memory.getMessages();
    expect(messages[0].content).toBe('Test message');
    expect(messages[0].role).toBe('user');
  });
});

describe('StringMapStorage Integration', () => {
  let adapter: InMemoryAdapter<Record<string, string>>;
  let storage: StringMapStorage;

  beforeEach(() => {
    adapter = new InMemoryAdapter<Record<string, string>>();
    storage = new StringMapStorage(adapter);
  });

  test('should emit events when configured', async () => {
    const saveCallback = jest.fn();
    const loadCallback = jest.fn();
    
    storage.setEmitMode('info');
    storage.on('save', saveCallback);
    storage.on('load', loadCallback);
    
    await storage.setValue('test-key', 'test-value');
    await storage.getValue('test-key');
    
    expect(saveCallback).toHaveBeenCalled();
    expect(loadCallback).toHaveBeenCalled();
  });

  test('should work with basic operations', async () => {
    const storage = new StringMapStorage();
    
    await storage.setValue('test-key', 'test-value');
    const value = await storage.getValue('test-key');
    
    expect(value).toBe('test-value');
  });

  test('should handle multiple sequential operations', async () => {
    // Add multiple values sequentially
    for (let i = 0; i < 10; i++) {
      await storage.setValue(`key${i}`, `value${i}`);
    }
    
    const stringMap = await storage.getStringMap();
    expect(Object.keys(stringMap)).toHaveLength(10);
    
    for (let i = 0; i < 10; i++) {
      expect(stringMap[`key${i}`]).toBe(`value${i}`);
    }
  });

  test('should maintain data consistency after multiple operations', async () => {
    await storage.setValue('key1', 'value1');
    await storage.setValue('key2', 'value2');
    await storage.setValue('key1', 'updated-value1'); // Overwrite
    await storage.removeKey('key2');
    await storage.setValue('key3', 'value3');
    
    const stringMap = await storage.getStringMap();
    expect(stringMap).toEqual({
      key1: 'updated-value1',
      key3: 'value3'
    });
  });

  test('should handle edge cases gracefully', async () => {
    // Test with empty string
    await storage.setValue('empty', '');
    expect(await storage.getValue('empty')).toBe('');
    
    // Test with special characters
    await storage.setValue('special', 'value with spaces and símbolos');
    expect(await storage.getValue('special')).toBe('value with spaces and símbolos');
    
    // Test with very long strings
    const longValue = 'x'.repeat(10000);
    await storage.setValue('long', longValue);
    expect(await storage.getValue('long')).toBe(longValue);
  });
});