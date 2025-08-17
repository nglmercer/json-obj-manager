// src/adapters/json-file.ts
import type { StorageAdapter } from '../core/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class JSONFileAdapter<T> implements StorageAdapter<T> {
  private filePath: string;
  public data: Record<string, T> = {};
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor(filename: string) {
    this.filePath = path.resolve(process.cwd(), filename);
  }

  private async ensureFileExists(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify({}), 'utf-8');
    }
  }

  private async readAllData(): Promise<Record<string, T>> {
    // Si ya está cargado, devolver los datos en caché
    if (this.isLoaded) {
      return this.data;
    }

    // Si ya hay una carga en progreso, esperar a que termine
    if (this.loadPromise) {
      await this.loadPromise;
      return this.data;
    }

    // Iniciar nueva carga
    this.loadPromise = this.performLoad();
    await this.loadPromise;
    this.loadPromise = null;
    return this.data;
  }

  private async performLoad(): Promise<void> {
    try {
      await this.ensureFileExists();
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      if (!fileContent.trim()) {
        this.data = {};
      } else {
        this.data = JSON.parse(fileContent);
      }
      this.isLoaded = true;
    } catch (error) {
      console.warn(`Error reading file ${this.filePath}:`, error);
      this.data = {};
      this.isLoaded = false;
    }
  }


  private async writeAllData(data: Record<string, T>): Promise<void> {
    try {
      await this.ensureFileExists();
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      this.data = data;
      this.isLoaded = true; // Marcar como cargado después de escribir
    } catch (error) {
      this.isLoaded = false; // Invalidar caché en caso de error
      throw new Error(`Error writing to file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  async save(key: string, data: T): Promise<void> {
    const allData = await this.readAllData();
    allData[key] = data;
    await this.writeAllData(allData);
  }

  async load(key: string): Promise<T | null> {
    const allData = await this.readAllData();
    return allData[key] || null;
  }

  async delete(key: string): Promise<void> {
    const allData = await this.readAllData();
    delete allData[key];
    await this.writeAllData(allData);
  }

  async clear(): Promise<void> {
    await this.writeAllData({});
  }

  // Método para obtener todos los datos
  async getAll(): Promise<Record<string, T>> {
    return await this.readAllData();
  }

  // Método para obtener la ruta del archivo
  getFilePath(): string {
    return this.filePath;
  }

  // Método para invalidar la caché y forzar recarga
  invalidateCache(): void {
    this.isLoaded = false;
    this.data = {};
  }
}