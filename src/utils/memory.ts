import { MemoryStore, Message } from '../core/types';
import { StorageAdapter } from '../core/types';
export class ChatMemory implements MemoryStore {
  public messages: Message[] = [];

  addUserMessage(content: string, timestamp?: Date): void {
    this.messages.push({
      role: 'user',
      content,
      timestamp
    });
  }

  addAIMessage(content: string, timestamp?: Date): void {
    this.messages.push({
      role: 'assistant',
      content,
      timestamp
    });
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }

  // Métodos adicionales útiles
  getLastMessages(count: number = 10): Message[] {
    return this.messages.slice(-count);
  }

  getMessagesSince(date: Date): Message[] {
    if (!date) {
      return this.messages;
    }
    return this.messages.filter(m => (m.timestamp || new Date())>= date);
  }
}

// Versión persistente con almacenamiento
export class PersistentChatMemory extends ChatMemory {
  private storageKey = 'chat-memory';
  private storage: StorageAdapter<Message[]>;
  private loaded = false;

  constructor(storage: StorageAdapter<Message[]>) {
    super();
    this.storage = storage;
    this.loadMessages();
  }

  override addUserMessage(content: string): void {
    super.addUserMessage(content);
    this.saveMessages();
  }

  override addAIMessage(content: string): void {
    super.addAIMessage(content);
    this.saveMessages();
  }

  override clear(): void {
    super.clear();
    this.storage.delete(this.storageKey);
  }

  async saveMessages(): Promise<void> {
    await this.storage.save(this.storageKey, this.getMessages());
  }

  async loadMessages(): Promise<void> {
    try {
      const saved = await this.storage.load(this.storageKey);
      if (saved && Array.isArray(saved)) {
        this.messages = saved.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
      }
      this.loaded = true;
    } catch (error) {
      console.warn('Error loading messages:', error);
      this.messages = [];
    }
  }

  // Método para forzar recarga
  async reload(): Promise<void> {
    await this.loadMessages();
  }

  // Método para obtener mensajes de forma asíncrona
  async getMessagesAsync(): Promise<Message[]> {
    if (!this.loaded) {
      await this.loadMessages();
    }
    return this.getMessages();
  }
}