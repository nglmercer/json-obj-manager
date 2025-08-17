import { StorageAdapter } from './types.js';
import { AllowedData } from './types.js';
import { Emitter } from '../utils/Emitter.js';

type EmitMode = 'all' | 'info';
export type DataStorageEvents = 'change' | 'save' | 'load' | 'delete' | 'clear';

export class DataStorage<T extends AllowedData> {
  private adapter: StorageAdapter<T>;
  private emitter: Emitter;
  private _emitMode: EmitMode = 'all'; // Por defecto emite todos los datos en 'change'

  constructor(adapter: StorageAdapter<T>, emitter?: Emitter) {
    this.adapter = adapter;
    this.emitter = emitter || new Emitter();
  }

  // Propiedad para configurar el modo de emisión
  get emitMode(): EmitMode {
    return this._emitMode;
  }

  set emitMode(mode: EmitMode) {
    this._emitMode = mode;
  }

  // Método para cambiar el modo de emisión
  setEmitMode(mode: EmitMode): this {
    this._emitMode = mode;
    return this;
  }

  async save(key: string, data: T): Promise<void> {
    if (!this.validateData(data)) {
      throw new Error('Invalid data format');
    }
    
    await this.adapter.save(key, data);
    
    if (this._emitMode === 'all') {
      // Comportamiento por defecto: emite todos los datos en 'change'
      this.emitter.emit('change', await this.getAll());
    } else {
      // Modo'info' emite eventos específicos con los datos específicos
      this.emitter.emit('save', { key, data });
    }
  }

  async load(key: string): Promise<T | null> {
    const data = await this.adapter.load(key);
    
    // Solo emite en modo'info'ya que load no modifica el storage
    if (this._emitMode === 'info' && data !== null) {
      this.emitter.emit('load', { key, data });
    }
    
    return data;
  }

  async delete(key: string): Promise<void> {
    // Obtener el dato antes de eliminarlo (para el evento en modo'info'
    const dataBeforeDelete = this._emitMode === 'info' ? await this.adapter.load(key) : null;
    
    await this.adapter.delete(key);
    
    if (this._emitMode === 'all') {
      // Comportamiento por defecto: emite todos los datos en 'change'
      this.emitter.emit('change', await this.getAll());
    } else {
      // Modo'info' emite evento específico con la clave eliminada
      this.emitter.emit('delete', { key, deletedData: dataBeforeDelete });
    }
  }

  async clear(): Promise<void> {
    // Obtener todos los datos antes de limpiar (para el evento en modo'info'
    const dataBeforeClear = this._emitMode === 'info' ? await this.getAll() : null;
    
    await this.adapter.clear();
    
    if (this._emitMode === 'all') {
      // Comportamiento por defecto: emite todos los datos en 'change' (será un objeto vacío)
      this.emitter.emit('change', await this.getAll());
    } else {
      // Modo'info' emite evento específico con los datos que se limpiaron
      this.emitter.emit('clear', { clearedData: dataBeforeClear });
    }
  }

  async getAll(): Promise<Record<string, T>> {
    // Si el adapter tiene método getAll, usarlo
    if (typeof this.adapter.getAll === 'function') {
      return await this.adapter.getAll();
    }
   
    // Fallback: cargar todos los datos individualmente
    // Esto es menos eficiente pero funciona
    return this.adapter.data || {};
  }

  private validateData(data: T): boolean {
    if (data === null || data === undefined) return false;
    
    // Validar que el dato sea serializable
    try {
      JSON.stringify(data);
      return true;
    } catch (error) {
      console.warn('Data is not serializable:', error);
      return false;
    }
  }

  // Eventos para modo 'all' (por defecto)
  public on(event: 'change', callback: (data: Record<string, T>) => void): () => void;
  
  // Eventos para modo 'info'
  public on(event: 'save', callback: (event: { key: string; data: T }) => void): () => void;
  public on(event: 'load', callback: (event: { key: string; data: T }) => void): () => void;
  public on(event: 'delete', callback: (event: { key: string; deletedData: T | null }) => void): () => void;
  public on(event: 'clear', callback: (event: { clearedData: Record<string, T> | null }) => void): () => void;
  
  // Implementación genérica
  public on(event: string, callback: (data: any) => void): () => void {
    return this.emitter.on(event, callback);
  }

  // Eventos para modo 'all' (por defecto)
  public once(event: 'change', callback: (data: Record<string, T>) => void): () => void;
  
  // Eventos para modo 'info'
  public once(event: 'save', callback: (event: { key: string; data: T }) => void): () => void;
  public once(event: 'load', callback: (event: { key: string; data: T }) => void): () => void;
  public once(event: 'delete', callback: (event: { key: string; deletedData: T | null }) => void): () => void;
  public once(event: 'clear', callback: (event: { clearedData: Record<string, T> | null }) => void): () => void;
  
  // Implementación genérica
  public once(event: string, callback: (data: any) => void): () => void {
    return this.emitter.once(event, callback);
  }

  // Métodos off genéricos
  public off(event: 'change', callback: (data: Record<string, T>) => void): void;
  public off(event: 'save', callback: (event: { key: string; data: T }) => void): void;
  public off(event: 'load', callback: (event: { key: string; data: T }) => void): void;
  public off(event: 'delete', callback: (event: { key: string; deletedData: T | null }) => void): void;
  public off(event: 'clear', callback: (event: { clearedData: Record<string, T> | null }) => void): void;
  public off(event: string, callback: (data: any) => void): void {
    this.emitter.off(event, callback);
  }
}


// Adaptador en memoria para ejemplo
export class InMemoryAdapter<T> implements StorageAdapter<T> {
  private storage = new Map<string, T>();

  async save(key: string, data: T): Promise<void> {
    this.storage.set(key, data);
  }

  async load(key: string): Promise<T | null> {
    return this.storage.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getAll(): Promise<Record<string, T>> {
    const result: Record<string, T> = {};
    for (const [key, value] of this.storage.entries()) {
      result[key] = value;
    }
    return result;
  }
}