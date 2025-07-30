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

  private async saveMessages(): Promise<void> {
    await this.storage.save(this.storageKey, this.getMessages());
  }

  private async loadMessages(): Promise<void> {
    const saved = await this.storage.load(this.storageKey);
    if (saved) {
      // Restaurar mensajes
      this.messages = saved;
    }
  }
}