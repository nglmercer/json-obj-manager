import { DataStorage, DataStorageEvents } from '../src/core/storage';

import { JSONFileAdapter } from '../src/adapters/json-file';
import { StringMapStorage } from '../src/utils/string-map-storage';
import { PersistentChatMemory } from '../src/utils/memory';
import path from 'path';
interface User {
    name: string;
    age: number;
}
const TempPath = path.join(process.cwd(), './temp');
async function test() {
    
    const chatMemory = new PersistentChatMemory(new JSONFileAdapter(TempPath +'/chat-history.json'));
    const userStorage = new DataStorage(new JSONFileAdapter<User>(TempPath + '/users.json'));
    const configStorage = new StringMapStorage(new JSONFileAdapter(TempPath + '/config.json'));
    userStorage.setEmitMode('info');
    configStorage.setEmitMode('info');

    const events:DataStorageEvents[] = [ 'delete','clear','load','save']


    // Para userStorage con emitMode = 'info'
    userStorage.on('save', (data) => console.log('userStorage save', data));
    userStorage.on('load', (data) => console.log('userStorage load', data));
    userStorage.on('delete', (data) => console.log('userStorage delete', data));
    userStorage.on('clear', (data) => console.log('userStorage clear', data));

    // Para configStorage con emitMode = 'info'
    configStorage.on('save', (data) => console.log('configStorage save', data));
    configStorage.on('load', (data) => console.log('configStorage load', data));
    configStorage.on('delete', (data) => console.log('configStorage delete', data));
    configStorage.on('clear', (data) => console.log('configStorage clear', data));
    
    await userStorage.save('user-1', { name: 'Juan', age: 30 });
    // 2. Con StringMapStorage
    await configStorage.setValue('theme', 'dark');
    await configStorage.setValue('language', 'es');
    
    chatMemory.addUserMessage('Hola, ¿cómo estás?');
    chatMemory.addAIMessage('¡Hola! Estoy bien, gracias por preguntar.');
    const alldata = [
        await chatMemory.getMessagesAsync(),
        await userStorage.getAll(),
        await configStorage.getAll()
    ]

    
    console.log("alldata",alldata)
}
test();