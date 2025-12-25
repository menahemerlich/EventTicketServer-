import express from 'express'
import { readFile, writeFile } from '../utils/functions.js'
import { authentication } from '../middleware/authentication.js'

export const userRouter = express()

const usersFile = './data/users.json'
const eventsFile = './data/events.json'
const receiptsFile = './data/receipts.json'


userRouter.post('/register', async (req, res) =>{
    const newUser = {}
    if (req.body && req.body.username && req.body.password && Object.keys(req.body).length === 2){
        const username = req.body.username
        const password = req.body.password
        const users = await readFile(usersFile)
        for (const user of users) {
            if (user.username === username){
                return res.status(409).send(`User: '${username}' already exists`)
            }
        }
        if (typeof username === "string" && typeof password === "string"){
            newUser.username = username
            newUser.password = password
            users.push(newUser)
            await writeFile(usersFile, users)
            return res.status(200).send(`User: '${username}' registered successfully.`)
        }
    } 
    return res.status(422).send('Error entering data.')
})

userRouter.post('/tickets/buy', authentication, async (req, res) => {
    const newReceipt = {}
    if (req.body  && Object.keys(req.body).length === 2 && req.body.eventName && req.body.quantity ){
        const eventName = req.body.eventName
        const quantity = req.body.quantity
        const username = req.headers['x-username']
        if (typeof eventName === "string" && typeof quantity === "number"){
            const events = await readFile(eventsFile)
            const receipts = await readFile(receiptsFile)
            for (const event of events) {
                if (event.eventName === eventName && (event.ticketsForSale - quantity) >= 0){
                    newReceipt.username = username
                    newReceipt.eventName = eventName
                    newReceipt.ticketsBought = quantity
                    event.ticketsForSale -= quantity
                    receipts.push(newReceipt)
                    await writeFile(receiptsFile, receipts)
                    await writeFile(eventsFile, events)
                    return res.status(200).send(`${quantity} Tickets for: '${eventName}' purchased successfully.`)
                } else {
                    return res.status(400).send('There is no such event or there are no tickets available for purchase.')
                }
            }
        }
    } 
    return res.status(422).send('Error entering data.')
})

userRouter.get('/:username/summary', async (req, res) => {
    const {username} = req.params
    let totalTicketsBought = 0
    const events = []
    const receipts = await readFile(receiptsFile)
    for (const receipt of receipts) {
        if (receipt.username === username){
            totalTicketsBought += receipt.ticketsBought
            if (!(events.includes(receipt.eventName))){
                events.push(receipt.eventName)
            }
        }
    }
    if (events.length > 0){
        res.status(200).json({
            "totalTicketsBought": totalTicketsBought,
            "events": events,
            "averageTicketsPerEvent": totalTicketsBought / events.length
        })
    } else {
        res.status(404).json({
            "totalTicketsBought": totalTicketsBought,
            "events": 0,
            "averageTicketsPerEvent": 0
        })
    }
})