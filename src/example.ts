import { DataStorage } from './core/storage';
import { JSONFileAdapter } from './adapters/json-file-adapter';
import { StringMapStorage } from './utils/string-map-storage';
import { PersistentChatMemory } from './utils/memory';
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
    const emitterListen = [
        userStorage.on('change', (data) => console.log('userStorage change', data)),
        configStorage.on('change', (data) => console.log('configStorage change', data)),
    ]
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