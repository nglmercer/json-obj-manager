# JSON Object Manager - Documentación Completa del API

[![npm version](https://badge.fury.io/js/json-obj-manager.svg)](https://badge.fury.io/js/json-obj-manager)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

Una librería completa de almacenamiento en TypeScript que proporciona APIs unificadas para persistencia de datos en Node.js, navegadores y escenarios en memoria.

## Tabla de Contenidos

- [Clases Principales](#clases-principales)
  - [DataStorage](#datastorage)
  - [StringMapStorage](#stringmapstorage)
  - [ChatMemory](#chatmemory)
  - [PersistentChatMemory](#persistentchatmemory)
  - [Emitter](#emitter)
- [Adaptadores](#adaptadores)
  - [JSONFileAdapter](#jsonfileadapter)
  - [LocalStorageAdapter](#localstorageadapter)
  - [InMemoryAdapter](#inmemoryadapter)
- [Tipos e Interfaces](#tipos-e-interfaces)
- [Sistema de Eventos](#sistema-de-eventos)
- [Uso Avanzado](#uso-avanzado)

## Clases Principales

### DataStorage<T>

Clase de almacenamiento genérica que proporciona una interfaz unificada para la persistencia de datos.

#### Constructor
```typescript
new DataStorage<T>(adapter: StorageAdapter<T>)
```

**Parámetros:**
- `adapter`: Adaptador de almacenamiento que implementa la interfaz `StorageAdapter<T>`

#### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `emitMode` | `EmitMode` | Modo actual de emisión de eventos (getter/setter) |

#### Métodos

##### save(key: string, data: T): Promise<void>
Guarda datos con la clave especificada.

**Parámetros:**
- `key`: Identificador único para los datos
- `data`: Datos a almacenar

**Eventos Emitidos:**
- `save`: Cuando los datos se guardan exitosamente

**Ejemplo:**
```typescript
const storage = new DataStorage<User>(adapter);
await storage.save('user-123', { name: 'Juan', age: 30 });
```

##### load(key: string): Promise<T | null>
Carga datos por clave.

**Parámetros:**
- `key`: Identificador único para los datos

**Retorna:**
- `Promise<T | null>`: Los datos almacenados o null si no se encuentran

**Eventos Emitidos:**
- `load`: Cuando los datos se cargan exitosamente

**Ejemplo:**
```typescript
const user = await storage.load('user-123');
if (user) {
  console.log(user.name);
}
```

##### delete(key: string): Promise<void>
Elimina datos por clave.

**Parámetros:**
- `key`: Identificador único para los datos a eliminar

**Eventos Emitidos:**
- `delete`: Cuando los datos se eliminan exitosamente

##### clear(): Promise<void>
Limpia todos los datos almacenados.

**Eventos Emitidos:**
- `clear`: Cuando todos los datos se limpian

##### getAll(): Promise<Record<string, T>>
Recupera todos los datos almacenados.

**Retorna:**
- `Promise<Record<string, T>>`: Objeto que contiene todos los pares clave-valor almacenados

##### setEmitMode(mode: EmitMode): void
Establece el modo de emisión de eventos.

**Parámetros:**
- `mode`: Uno de `'all'`, `'info'`, `'debug'`, `'error'`, `'none'`

##### Métodos de Eventos

###### on(event: DataStorageEvents, listener: Function): void
Registra un listener de eventos.

**Parámetros:**
- `event`: Nombre del evento (`'save'`, `'load'`, `'delete'`, `'clear'`)
- `listener`: Función a llamar cuando ocurre el evento

###### once(event: DataStorageEvents, listener: Function): void
Registra un listener de eventos de una sola vez.

###### off(event: DataStorageEvents, listener: Function): void
Remueve un listener de eventos.

### StringMapStorage

Almacenamiento especializado para pares clave-valor de strings, extendiendo la funcionalidad de DataStorage.

#### Constructor
```typescript
new StringMapStorage(adapter?: StorageAdapter<StringMap>)
```

**Parámetros:**
- `adapter`: Adaptador de almacenamiento opcional. Si no se proporciona, usa InMemoryAdapter

#### Métodos

##### setValue(key: string, value: string): Promise<void>
Establece un valor string para la clave dada.

**Parámetros:**
- `key`: La clave a establecer
- `value`: El valor string a almacenar

**Ejemplo:**
```typescript
const config = new StringMapStorage();
await config.setValue('theme', 'dark');
await config.setValue('language', 'es');
```

##### getValue(key: string): Promise<string | undefined>
Obtiene un valor string por clave.

**Parámetros:**
- `key`: La clave a recuperar

**Retorna:**
- `Promise<string | undefined>`: El valor almacenado o undefined

##### removeKey(key: string): Promise<void>
Remueve una clave del mapa de strings.

##### getStringMap(): Promise<StringMap>
Obtiene el mapa completo de strings.

**Retorna:**
- `Promise<StringMap>`: Mapa completo de clave-valor

##### getKeys(): Promise<string[]>
Obtiene todas las claves en el mapa de strings.

**Retorna:**
- `Promise<string[]>`: Array de todas las claves

##### getValues(): Promise<string[]>
Obtiene todos los valores en el mapa de strings.

**Retorna:**
- `Promise<string[]>`: Array de todos los valores

### ChatMemory

Almacenamiento en memoria de mensajes de chat con ordenamiento cronológico.

#### Constructor
```typescript
new ChatMemory()
```

#### Métodos

##### addMessage(message: Message): void
Añade un mensaje al historial de chat.

**Parámetros:**
- `message`: Objeto mensaje con rol, contenido y timestamp opcional

##### addUserMessage(content: string, timestamp?: Date): void
Añade un mensaje de usuario.

**Parámetros:**
- `content`: Contenido del mensaje
- `timestamp`: Timestamp opcional (por defecto es la hora actual)

##### addAIMessage(content: string, timestamp?: Date): void
Añade un mensaje de IA/asistente.

##### getMessages(): Message[]
Obtiene todos los mensajes en orden cronológico.

**Retorna:**
- `Message[]`: Array de todos los mensajes

##### getLastMessages(count?: number): Message[]
Obtiene los últimos N mensajes.

**Parámetros:**
- `count`: Número de mensajes a recuperar (por defecto: 10)

**Retorna:**
- `Message[]`: Array de mensajes recientes

##### getAllMessages(): Message[]
Alias para getMessages().

##### getMessagesSince(date: Date): Message[]
Obtiene mensajes desde una fecha específica.

**Parámetros:**
- `date`: Fecha umbral

**Retorna:**
- `Message[]`: Mensajes después de la fecha especificada

##### clear(): void
Limpia todos los mensajes de la memoria.

### PersistentChatMemory

Extiende ChatMemory con capacidades de almacenamiento persistente.

#### Constructor
```typescript
new PersistentChatMemory(adapter: StorageAdapter<Message[]>)
```

**Parámetros:**
- `adapter`: Adaptador de almacenamiento para persistencia de mensajes

#### Métodos Adicionales

##### saveMessages(): Promise<void>
Guarda los mensajes actuales en almacenamiento persistente.

##### loadMessages(): Promise<void>
Carga mensajes desde almacenamiento persistente.

##### addMessageAndSave(message: Message): Promise<void>
Añade un mensaje y lo guarda inmediatamente en almacenamiento.

**Parámetros:**
- `message`: Mensaje a añadir y guardar

### Emitter

Emisor de eventos poderoso con gestión avanzada de listeners.

#### Constructor
```typescript
new Emitter()
```

#### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `maxListeners` | `number` | Máximo de listeners por evento (por defecto: 10) |

#### Métodos

##### on(event: string, callback: Function): () => void
Registra un listener de eventos.

**Parámetros:**
- `event`: Nombre del evento
- `callback`: Función a ejecutar cuando se emite el evento

**Retorna:**
- `() => void`: Función para desregistrar el listener

**Ejemplo:**
```typescript
const emitter = new Emitter();
const unsubscribe = emitter.on('userLogin', (userData) => {
  console.log('Usuario logueado:', userData);
});

// Más tarde...
unsubscribe(); // Remover el listener
```

##### once(event: string, callback: Function): () => void
Registra un listener de eventos de una sola vez.

##### onAny(callback: (event: string, data: any) => void): () => void
Registra un listener para cualquier evento.

**Parámetros:**
- `callback`: Función que recibe el nombre del evento y los datos

##### onceAny(callback: (event: string, data: any) => void): () => void
Registra un listener de una sola vez para cualquier evento.

##### emit(event: string, data?: any): boolean
Emite un evento a todos los listeners registrados.

**Parámetros:**
- `event`: Nombre del evento
- `data`: Datos opcionales a enviar a los listeners

**Retorna:**
- `boolean`: True si había listeners para el evento

##### emitAsync(event: string, data?: any): Promise<boolean>
Versión asíncrona de emit.

**Retorna:**
- `Promise<boolean>`: Promise que resuelve a true si había listeners

##### off(event: string, callback: Function): void
Remueve un listener de eventos específico.

##### removeAllListeners(event?: string): void
Remueve todos los listeners para un evento o todos los eventos.

**Parámetros:**
- `event`: Nombre del evento opcional. Si no se proporciona, remueve todos los listeners

##### listenerCount(event: string): number
Obtiene el número de listeners para un evento.

**Retorna:**
- `number`: Número de listeners registrados

##### eventNames(): string[]
Obtiene nombres de todos los eventos con listeners.

**Retorna:**
- `string[]`: Array de nombres de eventos

##### setMaxListeners(n: number): void
Establece el número máximo de listeners por evento.

##### getMaxListeners(): number
Obtiene el límite actual de listeners máximos.

##### getListeners(event: string): Function[]
Obtiene todos los listeners para un evento específico.

##### getAnyListeners(): Function[]
Obtiene todos los listeners de eventos "any".

##### prependListener(event: string, callback: Function): () => void
Añade un listener al principio del array de listeners.

##### prependOnceListener(event: string, callback: Function): () => void
Añade un listener de una sola vez al principio del array de listeners.

##### debug(): object
Retorna información de depuración sobre el estado del emitter.

**Retorna:**
- Objeto con estadísticas sobre eventos, listeners y uso de memoria

##### destroy(): void
Limpia todos los listeners y libera memoria.

##### hasListeners(event: string): boolean
Verifica si un evento tiene listeners.

**Retorna:**
- `boolean`: True si el evento tiene listeners

## Adaptadores

### JSONFileAdapter<T>

Adaptador de sistema de archivos para entornos Node.js.

#### Constructor
```typescript
new JSONFileAdapter<T>(filename: string)
```

**Parámetros:**
- `filename`: Ruta al archivo JSON para almacenamiento

#### Métodos

##### ensureFileExists(): Promise<void>
Asegura que el archivo de almacenamiento existe, creándolo si es necesario.

##### readFile(): Promise<Record<string, T>>
Lee y parsea el archivo JSON.

##### writeFile(data: Record<string, T>): Promise<void>
Escribe datos al archivo JSON.

##### getFilePath(): string
Obtiene la ruta del archivo siendo usado para almacenamiento.

##### invalidateCache(): void
Invalida el caché interno, forzando la próxima lectura desde disco.

### LocalStorageAdapter<T>

Adaptador de localStorage del navegador.

#### Constructor
```typescript
new LocalStorageAdapter<T>(storageKey?: string)
```

**Parámetros:**
- `storageKey`: Clave opcional para localStorage (por defecto: 'json-obj-manager')

#### Métodos

##### getStorageKey(): string
Obtiene la clave de localStorage siendo usada.

##### sync(): void
Sincroniza con localStorage (útil para actualizaciones entre pestañas).

##### destroy(): void
Remueve completamente los datos de localStorage.

##### getUsageInfo(): object
Obtiene estadísticas de uso de almacenamiento.

**Retorna:**
- Objeto con información de tamaño y disponibilidad de almacenamiento

### InMemoryAdapter<T>

Adaptador simple de almacenamiento en memoria, perfecto para pruebas.

#### Constructor
```typescript
new InMemoryAdapter<T>()
```

## Tipos e Interfaces

### StorageAdapter<T>

Interfaz base que todos los adaptadores de almacenamiento deben implementar.

```typescript
interface StorageAdapter<T> {
  save(key: string, data: T): Promise<void>;
  load(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll?(): Promise<Record<string, T>>; // Método opcional
}
```

### ExtendedStorageAdapter<T>

Interfaz extendida con métodos opcionales adicionales.

```typescript
interface ExtendedStorageAdapter<T> extends StorageAdapter<T> {
  getAll(): Promise<Record<string, T>>;
  // Métodos adicionales específicos del adaptador
}
```

### Message

Interfaz para mensajes de chat.

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}
```

### StringMap

Tipo para pares clave-valor de strings.

```typescript
type StringMap = Record<string, string>;
```

### AllowedData

Tipo unión para tipos de datos soportados.

```typescript
type AllowedData = string | number | boolean | object | null | undefined;
```

### MemoryStore

Interfaz para operaciones de almacenamiento en memoria.

```typescript
interface MemoryStore {
  addUserMessage(content: string, timestamp?: Date): void;
  addAIMessage(content: string, timestamp?: Date): void;
  getMessages(): Message[];
  getLastMessages(count?: number): Message[];
  clear(): void;
}
```

### EmitMode

Modos de emisión de eventos para DataStorage.

```typescript
type EmitMode = 'all' | 'info' | 'debug' | 'error' | 'none';
```

### DataStorageEvents

Eventos disponibles para DataStorage.

```typescript
type DataStorageEvents = 'save' | 'load' | 'delete' | 'clear';
```

## Sistema de Eventos

La librería incluye un sistema de eventos comprensivo para monitorear operaciones de almacenamiento e implementar patrones reactivos.

### Modos de Emisión de Eventos

- **`'all'`**: Emite todos los cambios de datos (por defecto)
- **`'info'`**: Emite eventos informativos
- **`'debug'`**: Emite eventos de nivel debug
- **`'error'`**: Solo emite eventos de error
- **`'none'`**: Sin emisión de eventos

### Ejemplo de Manejo de Eventos

```typescript
const storage = new DataStorage(adapter);
storage.setEmitMode('info');

// Escuchar todas las operaciones de almacenamiento
storage.on('save', (data) => {
  console.log('Datos guardados:', data);
});

storage.on('load', (data) => {
  console.log('Datos cargados:', data);
});

storage.on('delete', (key) => {
  console.log('Datos eliminados:', key);
});

storage.on('clear', () => {
  console.log('Almacenamiento limpiado');
});
```

## Uso Avanzado

### Implementación de Adaptador Personalizado

```typescript
class CustomAdapter<T> implements StorageAdapter<T> {
  private data = new Map<string, T>();

  async save(key: string, data: T): Promise<void> {
    this.data.set(key, data);
    // Lógica personalizada aquí
  }

  async load(key: string): Promise<T | null> {
    return this.data.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async getAll(): Promise<Record<string, T>> {
    const result: Record<string, T> = {};
    for (const [key, value] of this.data) {
      result[key] = value;
    }
    return result;
  }
}
```

### Almacenamiento Type-Safe

```typescript
interface PerfilUsuario {
  id: string;
  nombre: string;
  email: string;
  preferencias: {
    tema: 'claro' | 'oscuro';
    notificaciones: boolean;
  };
}

const userStorage = new DataStorage<PerfilUsuario>(adapter);

// TypeScript asegura type safety
await userStorage.save('user-1', {
  id: 'user-1',
  nombre: 'Juan Pérez',
  email: 'juan@ejemplo.com',
  preferencias: {
    tema: 'oscuro',
    notificaciones: true
  }
});
```

### Arquitectura Dirigida por Eventos

```typescript
class ServicioUsuario {
  private storage: DataStorage<PerfilUsuario>;
  private emitter: Emitter;

  constructor(adapter: StorageAdapter<PerfilUsuario>) {
    this.storage = new DataStorage(adapter);
    this.emitter = new Emitter();
    this.configurarManejadoresEventos();
  }

  private configurarManejadoresEventos() {
    this.storage.on('save', (user) => {
      this.emitter.emit('usuarioActualizado', user);
    });

    this.storage.on('delete', (userId) => {
      this.emitter.emit('usuarioEliminado', userId);
    });
  }

  async crearUsuario(user: PerfilUsuario): Promise<void> {
    await this.storage.save(user.id, user);
    this.emitter.emit('usuarioCreado', user);
  }

  onEventoUsuario(event: string, callback: Function): () => void {
    return this.emitter.on(event, callback);
  }
}
```

### Funciones de Utilidad

La librería proporciona funciones factory convenientes:

```typescript
import { createMemory, createStringMap } from 'json-obj-manager';

// Crear chat en memoria
const chat = createMemory();

// Crear mapa de strings en memoria
const config = createStringMap();
```

---

**Para más ejemplos y patrones de uso avanzado, consulte el archivo README.md principal.**