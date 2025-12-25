import { readFile } from "../utils/functions.js";

const usersFile = './data/users.json'

export async function userPermissions(req, res, next) {
    const users = await readFile(usersFile)
    const username = req.headers['x-username']
    for (const user of users) {     
        if (user.username === username && user.role === "user"){
            next()
            return
        }
    }        
    return res.status(401).send('You do not have the appropriate permission.')
}

export async function adminPermissions(req, res, next) {
    const users = await readFile(usersFile)
    const username = req.headers['x-username']
    for (const user of users) {     
        if (user.username === username && user.role === "admin"){
            next()
            return
        }
    }        
    return res.status(401).send('You do not have the appropriate permission.')
}