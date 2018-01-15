import Router from 'koa-router'

import { Bus } from '../../../models'
import { saveBus, getBusData, updateBus } from './bus.controller'

const busRouter = new Router({ prefix : 'bus' })

// Retrieve all busses
busRouter.get('/all', async ctx => {
  const {
    // limit = 10,
    // skip = 0,
    assigned = 'true',
    status,
  } = ctx.query

  const statusExt = `STANDBY,OK${ status ? `,${ status }` : '' }`

  const list = [].concat(statusExt ? statusExt.split(',') : '')
  const conditions = { status : { $in : list }}

  if(assigned === 'true') conditions.user = { $ne : null }

  try {
    const busses = await Bus
                    .find(conditions)
                    .sort({ _id : -1 })
                    // .skip(skip)
                    // .limit(limit)
                    .exec()

    const data = await Promise.all(busses.map(getBusData))

    // const count = await Bus.count({})

    if(data.length) return ctx.body = { ok : true, data : { busses : data /*, count*/ }, message : '' }

    return ctx.body = { ok : false, data : null, message : 'There are no available busses to retrieve' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error retrieving the busses' }
})

// Retrieve a bus with :id
busRouter.get('/:id', async ctx => {
  const { id } = ctx.params

  try {
    const bus = await Bus.findOne({ id })

    if(bus) {
      const data = await getBusData(bus)

      if(data) return ctx.body = { ok : true, data : { bus : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There is no available bus with that ID' }
  } catch (e) {
    console.log(e)
  }
  
  return ctx.body = { ok : false, data : null, message : 'Error retrieving the bus' }
})

// Saves a bus
busRouter.post('/save', async ctx => {
  const { body } = ctx.request

  try {
    const data = await saveBus(body)

    if(data) return ctx.body = { ok : true, data : { bus : data }, message : '' }

    return ctx.body = { ok : false, data : null, message : 'Couldn\'t save bus properly.' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error saving bus.' }
})

// Modify bus status
busRouter.put('/:id/modify', async ctx => {
  const { id } = ctx.params
  const { body } = ctx.request

  try {
    const bus = await Bus.findOne({ id })

    if(bus) {
      const data = await updateBus(bus, body)

      if(data) return ctx.body = { ok : true, data : { bus : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'Couldn\'t modify bus status.' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error modifying bus.' }
})

busRouter.get('/set-status/:id/:status', async ctx => {
  const { id, status } = ctx.params

  const active = status === 'ACTIVE'

  try {
    const bus = await Bus.findOne({ id })

    if(bus) {
      const data = await updateBus(bus, { active })

      if(data) return ctx.body = { ok : true, data : { bus : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : `Couldn't set bus to ${ active }` }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error modifying bus.' }
})

export default busRouter