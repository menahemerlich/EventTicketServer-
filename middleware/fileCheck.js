import { createFile } from "../utils/functions.js";

const usersFile = './data/users.json'
const eventsFile = './data/events.json'
const receiptsFile = './data/receipts.json'

const files = [usersFile, eventsFile, receiptsFile]

export async function fileCheck(req, res, next) {
    for (const file of files) {
        await createFile(file)
    }
    next()
}