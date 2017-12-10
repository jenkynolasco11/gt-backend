import Router from 'koa-router'

import { Bus, BusDetail, Person, User } from '../../models'

const busRouter = new Router({ prefix : 'bus' })

const getBusData = async bus => {
  try {
    const { _id, alias, name, status, user } = bus
    const { seats, luggage } = await BusDetail.findOne({ bus })
    const { person, position } = await User.findById(user)
    const { firstname, lastname, phoneNumber } = await Person.findById(person)

    const data = {
      id : _id,
      name,
      alias,
      driver : {
        firstname,
        lastname,
        phoneNumber,
        position,
      },
      status,
      seats,
      luggage
    }

    return data
  } catch (e) {
    console.log(e)
  }

  return null
}

const saveBus = async data => {
  try {
    const {
      user,
      alias,
      name,
      status = 'STANDBY',
      seats,
      luggage,
    } = data

    const bus = await new Bus({
      user,
      alias,
      name,
      status
    }).save()

    const details = await new BusDetail({
      bus : bus._id,
      seats,
      luggage
    }).save()

    return bus._id
  } catch (e) {
    // Delete bus in case there is an error in here
    console.log(e)
  }

  return null
}

// Retrieve all busses
busRouter.get('/all', async ctx => {
  const {
    // limit = 10,
    // skip = 0,
    status,
  } = ctx.query
  // console.log('wtf!?')
  // 'STANDBY', 'OK', 'DAMAGED', 'RETIRED', ''

  const statusExt = `STANDBY,OK${ status ? `,${ status }` : '' }`

  const list = [].concat(statusExt ? statusExt.split(',') : '')
  const conditions = { status : { $in : list }}

  // console.log(conditions)

  try {
    const busses = await Bus
                    .find(conditions)
                    .sort({ _id : -1 })
                    // .skip(skip)
                    // .limit(limit)
                    .exec()

    const data = await Promise.all(busses.map(getBusData))

    const count = await Bus.count({})

    if(data.length) return ctx.body = { ok : true, data : { busses : data, count }, message : '' }

  } catch (e) {
    console.log(e)
    return ctx.body = { ok : false, data : null, message : 'Error retrieving the busses' }
  }

  return ctx.body = { ok : false, data : null, message : 'There are no available busses to retrieve' }
})

// Retrieve a bus with :id
busRouter.get('/:id', async ctx => {
  // console.log('to retrieve ID')
  const { id } = ctx.params

  try {
    const bus = await Bus.findById(id)

    if(bus) {
      const data = await getBusData(bus)

      if(bus) return ctx.body = { ok : true, data, message : '' }
    }
  } catch (e) {
    return ctx.body = { ok : false, data : null, message : 'Error retrieving the bus' }
  }
  return ctx.body = { ok : false, data : null, message : 'There is no available bus with that ID' }
})

// Saves a bus
busRouter.post('/insert', async ctx => {
  const { body } = ctx.request

  try {
    const data = await saveBus(body)

    if(data) return ctx.body = { ok : true, data : { busId : data }, message : '' }
  } catch (e) {
    return ctx.body = { ok : false, data : null, message : 'Error saving bus.' }
  }

  return ctx.body = { ok : false, data : null, message : 'Couldn\'t save bus properly.' }
})

export default busRouter