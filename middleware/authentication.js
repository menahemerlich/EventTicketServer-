import { readFile } from "../utils/functions.js";

const usersFile = './data/users.json'

export async function authentication(req, res, next) {
    const users = await readFile(usersFile)
    const username = req.headers['x-username']
    const password = req.headers['x-password']
    for (const user of users) {     
        if (user.username === username && user.password == password){
            next()
            return
        }
    }        
    return res.status(401).send('Unauthorized')
}