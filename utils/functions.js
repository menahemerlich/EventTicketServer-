import { promises as fsPromises } from 'fs'
import fs  from 'fs' 


export async function readFile(fileName) {
        try {
        const data = await fsPromises.readFile(fileName, 'utf8') 
        const dataToJson = await JSON.parse(data)
            return dataToJson
    } catch (error) {
        console.error(`Error read file:`, error);
    }
}

export async function writeFile(fileName, data) {
    try {
            await fsPromises.writeFile(fileName, JSON.stringify(data), 'utf8')
            console.log(`Data written to ${fileName}`);
        } catch (error) {
            console.error(`Error writing file:`, error);
        }
}

export async function createFile(filePath){
    if (fs.existsSync(filePath)){
        return true
    }else {
        await writeFile(filePath, [])
        console.log(`${filePath} was creates.`);
    }
}

export function checkKeys(possiblekeys, keysList){
    for (const key of keysList) {
        if (!(possiblekeys.includes(key))){
            return false
        }
    }
    return true
}
