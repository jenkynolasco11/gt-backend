import Router from 'koa-router'

import { Receipt, Ticket } from '../../models'
// import { Ride, RideDetail, Bus, } from '../../models'

const receiptRouter = new Router({ prefix : 'receipt' })

receiptRouter.get('/:id/tickets', async ctx => { 
  const { id } = ctx.params
  try {
    const receipt = await Receipt.findOne({ id })
    console.log(receipt)
    const tickets = await Ticket.find({ receipt : receipt._id })

    if(tickets) return ctx.body = { ok : true, data : { tickets }, message : ''}

  } catch (e) {
    console.log(e)
  }

  return ctx.body = null
})

receiptRouter.get('/:id', async ctx => {
  const { id } = ctx.params

  try {
    const receipt = await Receipt.findOne({ id })

    if(receipt) return ctx.body = { ok : true, data : { receipt }, message : '' }

    return ctx.body = { ok : false, data : null, message : 'There are no receipts under that ID' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error retrieving your receipt' }
})

export default receiptRouter