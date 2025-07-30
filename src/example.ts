import { DataStorage } from './core/storage';
import { JSONFile } from './adapters/json-file-adapter';
import { StringMapStorage } from './utils/string-map-storage';
import { PersistentChatMemory } from './utils/memory';
import path from 'path';
interface User {
    name: string;
    age: number;
}
const TempPath = path.join(process.cwd(), './temp');
async function test() {
    
    const chatMemory = new PersistentChatMemory(new JSONFile(TempPath +'/chat-history.json'));
    const userStorage = new DataStorage(new JSONFile<User>(TempPath + '/users.json'));
    const configStorage = new StringMapStorage(new JSONFile(TempPath + '/config.json'));

/*     await userStorage.save('user-1', { name: 'Juan', age: 30 });
    // 2. Con StringMapStorage
    await configStorage.setValue('theme', 'dark');
    await configStorage.setValue('language', 'es');
    
    chatMemory.addUserMessage('Hola, ¿cómo estás?');
    chatMemory.addAIMessage('¡Hola! Estoy bien, gracias por preguntar.'); */
    const alldata = [
        await chatMemory.getMessagesAsync(),
        await userStorage.getAll(),
        await configStorage.getAll()
    ]
    console.log("alldata",alldata)
}
test();