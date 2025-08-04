// src/adapters/json-file.ts
import type { StorageAdapter } from '../core/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class JSONFileAdapter<T> implements StorageAdapter<T> {
  private filePath: string;
  public data: Record<string, T> = {};

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
    try {
      await this.ensureFileExists();
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      if (!fileContent.trim()) return {};
      this.data = JSON.parse(fileContent);
      return this.data;
    } catch (error) {
      console.warn(`Error reading file ${this.filePath}:`, error);
      return {};
    }
  }


  private async writeAllData(data: Record<string, T>): Promise<void> {
    try {
      await this.ensureFileExists();
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      this.data = data;
    } catch (error) {
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
}