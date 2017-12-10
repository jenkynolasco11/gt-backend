import Router from 'koa-router'

import { Ticket, Receipt, TicketDetail, Ride, Meta } from '../../models'
import { getTicketData, getTicketReceipt, reformatTicket, saveTickets, updateTicket } from './ticket.controller'

const ticketRouter = new Router({ prefix : 'ticket' })

// //////////////////////// Routes
// Retrieve a ticket payment information
ticketRouter.get('/:id/receipt', async ctx => {
  const { id } = ctx.params

    try {
      const tckt = await Ticket.findOne({ id })

      if(tckt) {
        const data = await getTicketReceipt(tckt)

        return ctx.body = { ok : true, data, message : '' }
      }

      return ctx.body = { ok : false, data : null, message : 'Couldn\'t retrieve payment details' }
    } catch (e) {
      return ctx.body = { ok : false, data : null, message : 'Error retrieving payment details' }
    }
})

// TODO : Check this one when I create the form for ticket creation
// Saves a(s many) ticket
ticketRouter.post('/save', reformatTicket, async ctx => {
  const { body } = ctx.request

  // TODO : Add this later. With this, I'll know if it's 
  // const { isLocal } = body
  // console.log('RIGHT HERE!!')
  // console.log(body)

  // return ctx.body = { ok : true, data : body }

  try {
    const data = await saveTickets(body)
    // console.log(data)

    // return the receipt instead
    console.log(data)
    if(data) return ctx.body = { ok : true, data : { receipt : data }, message : '' }

    return ctx.body = { ok : false, data : null, message : 'Couldn\'t save the ticket. Contact your system administrator.' }
  } catch (e) {
    console.log(e)
    return ctx.body = { ok : false, data : null, message : 'Error trying to save your ticket.' }
  }
})

ticketRouter.put('/modify', async ctx => {
  const { body } = ctx.request
  const { id } = body

  try {
    const data = await updateTicket(id, body)

    if(data) return ctx.body = { ok : true, data : { ticket : data }, message : '' }
  } catch (e) {
    console.log(e)
    return ctx.body = { ok : false, data : null, message : `Error updating ticket #${ id }.` }
  }
  return ctx.body = { ok : false, data : null, message : `Couldn't update the ticket #${ id }.` }
})

// Return all tickets that are not USED nor NULL
ticketRouter.get('/all', async ctx => {
  const { 
    status = [ 'NULL', 'USED', 'DELETED' ],
    limit = 10,
    skip = 0,
    unassigned = true,
    sort = 'date -1'
  } = ctx.query

  const list = [].concat(status)
  const conditions = { status : { $nin : list }}

  if(unassigned) conditions.ride = null

  const [ srt, asc ] = sort.split(' ')
  const sortCondition = { [ srt ] : Number(asc) }

  if(srt === 'date') sortCondition.time = 1

  try {
    const tickets = await Ticket
                          .find(conditions)
                          .skip(Number(skip))
                          .limit(Number(limit))
                          .sort(sortCondition)
                          .exec()

    if(tickets.length) {
      const data = await Promise.all(tickets.map(getTicketData))

      const count = await Ticket.count(conditions)

      if(data.length) return ctx.body = { ok : true, data : { tickets : data, count }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There are no tickets.' }
  } catch (e) {
    console.log(e)
  }
  return ctx.body = { ok : false, data : null, message : 'Eor retrieving the tickets for this ride' }
})

// Retrieve all tickets from ride
ticketRouter.get('/all/:rideId', async ctx => {
  const { rideId } = ctx.params

  // if(/\D/.test(time)) return ctx.body = { ok : false, data : null, message : 'Not a valid time parameter' }

  try {
    const ride = await Ride.findOne({ id : rideId })
    const tickets = await Ticket.find({ ride : ride._id }).sort({ id : -1 }).exec()

    if(tickets.length) {
      const data = await Promise.all(tickets.map(getTicketData))

      return ctx.body = { ok : true, data, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There are no ticket for this ride' }
  } catch (e) {
    return ctx.body = { ok : false, data : null, message : 'Error retrieving the tickets for this ride' }
  }
})

// /////////////////////////////////////
/** Not assigned yet */
// Get tickets by Date range (if d2 is not passed, all tickets by date d1)
ticketRouter.get('/date/:d1/:d2?', async ctx => {
  let { d1, d2 } = ctx.params
  const { limit = 20, skip = 0 } = ctx.query

  let tickets = []

  const dateX = parseInt(d1)
  const date1 = new Date(dateX)

  // Set hours to 0
  date1.setHours(0,0,0,0)

  d2 = d2 ? d2 : new Date(parseInt(d1)).setDate(new Date(date1).getDate() + 1)

  const dateX2 = parseInt(d2)
  const date2  = new Date(dateX2)
  date2.setHours(0,0,0,0)

  try {
    const details = await TicketDetail.aggregate([
      { $skip : skip },
      { $match : { date : { $gte : date1, $lte : date2 }}},
      { $limit : limit },
      { $sort : { date : -1, time : 1 }},
    ])

    // console.log(details.map( t => t._id))
    // // return ctx.body = "ñe"

    if(details.length)
      tickets = await Promise.all(
        details.map(det => Ticket.findOne({ details : det._id }))
      )

    if(tickets.length) {
      const data = await Promise.all(tickets.map(getTicketData))

      return ctx.body = { ok : true, data : data.filter(Boolean), message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There are no ticket for this ride' }
  } catch (e) {
    console.log(e)
    return ctx.body = { ok : false, data : null, message : 'Error retrieving the tickets for this ride' }
  }
})

/** Not assigned yet */
// Assign ride to ticket
ticketRouter.put('/modify/ride', async ctx => {
  const { ticketIds, rideId } = ctx.request.body
  const tickts = JSON.parse(ticketIds)

  try {
    const rid = await Ride.findById(rideId)

    if(!rid) return ctx.body = { ok : false, data : null, message : 'There is no ride assigned to this id.' }

    const data = await Promise.all(
      tickts.map( tcktId => (
        Ticket.findByIdAndUpdate(tcktId, { ride : rid._id })
      ))
    )

    if(data.length) return ctx.body = { ok : true, data : null, message : '' }

    return ctx.body = { ok : false, data : null, message : 'There is no ticket with that id.' }
  } catch (e) {
    return ctx.body = { ok : false, data : null, message : 'Error retrieving assigning ride to ticket' }
  }
})

/** Not assigned yet */
// Modify ticket status => [ 'USED', 'REDEEMABLE', 'NULL', 'NEW', 'DELETED' ]
ticketRouter.put('/modify/status', async ctx => {
  const { ticketIds, status } = ctx.request.body

  const tckts = JSON.parse(ticketIds)

  try {
    const data = await Promise.all(
      tckts.map( ticktId => (
        Ticket.findByIdAndUpdate(ticktId, { status })
      ))
    )

    if(data) return ctx.body = { ok : true, data : null, message : '' }

    return ctx.body = { ok : false, data : null, message : 'There is no ticket with that id.' }
  } catch (e) {
    console.log(e)
    return ctx.body = { ok : false, data : null, message : 'Error changing ticket status' }
  }
})
// //////////////////////////////////////

// Retrieve a ticket information
ticketRouter.get('/:id', async ctx => {
  const { id } = ctx.params

  try {
    const tckt = await Ticket.findOne({ id })

    if(tckt) {
      const ticketData = await getTicketData(tckt)
      
      if(ticketData) return ctx.body = { ok : true, data : ticketData, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'Couldn\'t retrieve ticket. Either doesn\'t exist or we have a problem on the server' }
  } catch (e) {
    return ctx.body = { ok : false, data : null, message : 'Error retrieving ticket' }
  }
})

export default ticketRouter