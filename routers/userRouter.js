import express from 'express'
import { readFile, writeFile, checkKeys } from '../utils/functions.js'
import { authentication } from '../middleware/authentication.js'
import { adminPermissions } from '../middleware/permissions.js'

export const userRouter = express()

const usersFile = './data/users.json'
const eventsFile = './data/events.json'
const receiptsFile = './data/receipts.json'


userRouter.post('/register', async (req, res) =>{
    const newUser = {}
    const possiblekeys = ["username", "password", "role"]
    const keys = Object.keys(req.body)
    if (req.body && req.body.username && req.body.password && checkKeys(possiblekeys, keys)){
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
            if (req.body.role && typeof req.body.role === "string" ){
                if (req.body.role === "user" || req.body.role === "admin"){
                    newUser.role = req.body.role
                } else {
                    return res.status(400).send('Role does not exist in the system.')
                }
            } else {
                newUser.role = "user"
            }
            users.push(newUser)
            await writeFile(usersFile, users)
            return res.status(200).send(`User: '${username}' registered successfully.`)
        }
    } 
    return res.status(422).send('Error entering data.')
})

userRouter.post('/tickets/buy', authentication, adminPermissions, async (req, res) => {
    const newReceipt = {}
    if (req.body  && Object.keys(req.body).length === 2 && req.body.eventName && req.body.quantity ){
        const eventName = req.body.eventName
        const quantity = req.body.quantity
        const username = req.headers['x-username']
        if (typeof eventName === "string" && typeof quantity === "number"){
            const events = await readFile(eventsFile)
            const receipts = await readFile(receiptsFile)
            for (const event of events) {
                if (event.eventName.toLowerCase() === eventName.toLowerCase() && (event.ticketsForSale - quantity) >= 0){
                    newReceipt.username = username
                    newReceipt.eventName = eventName
                    newReceipt.ticketsBought = quantity
                    event.ticketsForSale -= quantity
                    receipts.push(newReceipt)
                    await writeFile(receiptsFile, receipts)
                    await writeFile(eventsFile, events)
                    return res.status(200).send(`${quantity} Tickets for: '${eventName}' purchased successfully.`)
                }
            }
            return res.status(422).send('There is no such event or there are no tickets available for purchase.')
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

userRouter.put('/tickets/transfer', authentication, async (req, res) => {
    if (req.body  && Object.keys(req.body).length === 3 && req.body.seller && req.body.buyer && req.body.eventName){
        const seller = req.body.seller
        const buyer = req.body.buyer
        const eventName = req.body.eventName
        const username = req.headers['x-username']
        if (username === seller && typeof seller === "string" && typeof buyer === "string" && typeof eventName === "string"){
            let receipts = await readFile(receiptsFile)
            for (const receipt of receipts){
                if (receipt.username === seller && receipt.eventName.toLowerCase() === eventName.toLowerCase()){
                    receipt.username = buyer
                    await writeFile(receiptsFile, receipts)
                    return res.status(200).send('The replacement was successful.')
                }
            }
            return res.status(404).send('You do not have tickets to deliver at this event.')
        }
    }
    return res.status(422).send('Error entering data.')
})


userRouter.put('/tickets/refunds', authentication, async (req, res) => {
    if (req.body  && Object.keys(req.body).length === 2 && req.body.eventName && req.body.quantity ){
        const eventName = req.body.eventName
        const quantity = req.body.quantity
        const username = req.headers['x-username']
        if (typeof eventName === "string" && typeof quantity === "number"){
            const events = await readFile(eventsFile)
            let receipts = await readFile(receiptsFile)
            for (const receipt of receipts) {                
                if (receipt.username === username && receipt.eventName.toLowerCase() === eventName.toLowerCase() && (receipt.ticketsBought - quantity) >= 0){
                    for (const event of events) {                        
                        if (event.eventName.toLowerCase() === eventName.toLowerCase()){
                            receipt.ticketsBought -= quantity
                            event.ticketsForSale += quantity
                            receipts = receipts.filter((receipt) => {
                                    if (receipt.ticketsBought > 0){
                                        return true
                                    }
                                })
                            await writeFile(receiptsFile, receipts)
                            await writeFile(eventsFile, events)
                            return res.status(200).send(`Return of ${quantity} tickets an '${eventName}'.`)
                        }
                    }
                }
            }
            return res.status(422).send('You do not have enough tickets for this event to return.')
        }
    } 
    return res.status(422).send('Error entering data.')
})