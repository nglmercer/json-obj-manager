import { StorageAdapter } from '../core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class JSONFileAdapter<T> implements StorageAdapter<T> {
  private filePath: string;

  constructor(filename: string) {
    // Usar process.cwd() para rutas relativas
    this.filePath = path.resolve(process.cwd(), filename);
  }

  private async ensureFileExists(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      // Si no existe, crear directorio si es necesario y archivo vacío
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify({}), 'utf-8');
    }
  }

  private isValidJSON(data: string): boolean {
    try {
      JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  async save(key: string, data: T): Promise<void> {
    await this.ensureFileExists();

    try {
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      let allData: Record<string, T> = {};
      
      // Si el archivo tiene contenido válido, cargarlo
      if (fileContent.trim() && this.isValidJSON(fileContent)) {
        allData = JSON.parse(fileContent);
      }
      
      allData[key] = data;
      await fs.writeFile(this.filePath, JSON.stringify(allData, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Error saving data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async load(key: string): Promise<T | null> {
    try {
      await this.ensureFileExists();
      
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      
      // Si el archivo está vacío o es inválido, retornar null
      if (!fileContent.trim() || !this.isValidJSON(fileContent)) {
        return null;
      }
      
      const allData = JSON.parse(fileContent);
      return allData[key] || null;
    } catch (error) {
      // Si hay error de parsing o lectura, retornar null
      if (error instanceof SyntaxError) {
        console.warn(`Corrupted JSON file: ${error.message}`);
        return null;
      }
      
      throw new Error(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.ensureFileExists();
      
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      
      if (!fileContent.trim() || !this.isValidJSON(fileContent)) {
        return;
      }
      
      const allData = JSON.parse(fileContent);
      delete allData[key];
      
      await fs.writeFile(this.filePath, JSON.stringify(allData, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Error deleting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureFileExists();
      await fs.writeFile(this.filePath, JSON.stringify({}), 'utf-8');
    } catch (error) {
      throw new Error(`Error clearing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Método adicional para obtener la ruta del archivo
  getFilePath(): string {
    return this.filePath;
  }
}