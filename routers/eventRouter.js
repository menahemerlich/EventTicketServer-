import express from 'express'
import { readFile, writeFile } from '../utils/functions.js'
import { authentication } from '../middleware/authentication.js'
import { userPermissions } from '../middleware/permissions.js'

export const eventRouter = express()

const eventsFile = './data/events.json'

eventRouter.post('/creator/events', authentication, userPermissions, async (req, res) =>{
    const newEvent = {}
    if (req.body  && Object.keys(req.body).length === 2 && req.body.eventName && req.body.ticketsForSale ){
        const eventName = req.body.eventName
        const ticketsForSale = req.body.ticketsForSale
        const username = req.headers['x-username']
        if (typeof eventName === "string" && typeof ticketsForSale === "number"){
            const events = await readFile(eventsFile)
            newEvent.eventName = eventName
            newEvent.ticketsForSale = ticketsForSale
            newEvent.createdBy = username
            events.push(newEvent)
            await writeFile(eventsFile, events)
            return res.status(200).send(`Event: '${eventName}' created successfully.`)
        }
    } 
    return res.status(422).send('Error entering data.')
})
