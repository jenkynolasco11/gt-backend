import Router from 'koa-router'

import { Ride, Bus } from '../../../models'
import { getRideData, createRide, updateRide } from './ride.controller'
import { sockets } from '../../../socket.io-server'
import { filterDoc, filterAggregate } from '../../../utils'

const rideRouter = new Router({ prefix : 'ride' })

// Retrieve all rides
rideRouter.get('/all', async ctx => {
  const {
    status = 'PENDING',
    limit = 10,
    skip = 0,
    sort = 'date -1',
    future = 'true',
  } = ctx.query

  const list = [].concat(status.split(','))
  const conditions = { status : { $in : list }}

  const [ srt, asc ] = sort.split(' ')
  const sortCondition = { [ srt ] : Number(asc) }

  if(srt === 'date') sortCondition.time = 1// asc < 0 ? -1 : 1
  if(srt === 'time') sortCondition.date = asc < 0 ? -1 : 1

  if(future === 'true') {
    const tmpDate = new Date().setHours(0,0,0,0)

    conditions.date = { $gte : new Date(tmpDate - 86400000) }
  }

  try {
    const rides = await Ride
                        .find(conditions)
                        .skip(Number(skip))
                        .limit(Number(limit))
                        .sort(sortCondition)
                        .exec()

    if(rides.length) {
      const data = await Promise.all(rides.map(getRideData))

      const count = await Ride.count(conditions)

      if(data.length) return ctx.body = { ok : true, data : { rides : data, count }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'No rides available' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error retrieving rides' }
})

rideRouter.get('/all/:bus', async ctx => {
  const { bus } = ctx.params

  try {
    const bs = await Bus.findOne({ id : bus }, { _id : 1 })

    const conditions = { bus : bs._id }

    const rides = await Ride.aggregate([
      { $match : conditions },
      { 
        $group : {
          _id : {
            month : { $month : '$date' },
            date : { $dayOfMonth : '$date' },
            year : { $year : '$date' }
        },
          body : { $push : '$$ROOT' }
        }
      },
    ])

    if(rides.length) {
      const data = await Promise.all(filterAggregate(rides, getRideData, 'asc'))

      if(data.length) return ctx.body = { ok : true, data : { rides : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'No rides available' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error retrieving rides' }
})

// Saves a ride
rideRouter.post('/save', async ctx => {
  const { body } = ctx.request

  try {
    const rid = await createRide(body)

    if(rid) return ctx.body = { ok : true, data : { ride : rid }, message : '' }

    return ctx.body = { ok : false, data : null, message : 'Couldn\'t save route in DB' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error saving ride in DB' }
})

// Retrieve rides on date and hour.
// Note: If hour is -1, retrieve all rides on that date
rideRouter.get('/date/:date/hour/:hour', async ctx => {
  const { date, hour } = ctx.params

  const dateX = parseInt(date)

  const date1 = new Date(dateX)
  const date2 = new Date(dateX).setDate(date1.getDate() + 1)

  const conditions = { date : { $gte : date1, $lt : new Date(date2) }}

  if(hour >= 0 && hour < 24) conditions.time = hour

  // This is debatable
  conditions.bus = { $ne : null }

  try {
    // console.log(conditions)
    const rides = await Ride.find(conditions)

    // console.log(await Ride.find({}))

    if(rides.length) {
      const data = await Promise.all(rides.map(getRideData))

      return ctx.body = { ok : true, data : { rides : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There are no rides for this date' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error retrieving rides' }
})

// Assigns bus to ride
rideRouter.put('/assign-bus', async ctx => {
  const { bus, rides = [] } = ctx.request.body

  try {
    const bs = await Bus.findOne({ id : bus }, { _id : 1 })
    const promises = []

    if(bs) {
      rides.forEach(id => {
        promises.push(Ride.findOneAndUpdate({ id }, { bus : bs._id, status : 'ASSIGNED' }))
      })

      const rids = await Promise.all(promises)

      if(rids) return ctx.body = { ok : true, data : null, message : `Ride${ rides.length > 1 ? 's' : '' } assigned!` }
    }
  } catch (e) {
    console.log(e)

    return ctx.body = { ok : false, data : null, message : 'Error retrieving rides' }
  }

  return ctx.body = { ok : false, data : null, message : 'There are no rides for this date' }
})

// Modifies the ride
rideRouter.put('/:id/modify', async ctx => {
  const { id } = ctx.params
  const { body } = ctx.request

  try {
    const rid = await Ride.findOne({ id })

    // console.log(rid)
    if(rid) {
      const data = await updateRide(rid, body)

      if(data) return ctx.body = { ok : true, data : { ride : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There is no ride assigned to that id' }
  } catch(e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error retrieving ride' }
})

// Retrieves Ride
rideRouter.get('/:id', async ctx => {
  const { id } = ctx.params
  try {
    const rid = await Ride.findOne({ id })

    if(rid) {
      const data = await getRideData(rid)

      if(data) return ctx.body = { ok : true, data : { ride : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There is no ride assigned to that id' }
  } catch(e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error retrieving ride' }
})

// Dispatch rides to buses
rideRouter.put('/dispatch', async ctx => {
  const { rides : rids } = ctx.request.body

  try {
    const rides = await Promise.all(
      rids.map(id => Ride.findOne({ id }, { id : 1, bus : 1 }).populate('bus', { id : 1, status : 1, _id : 0 }).exec())
    )

    rides.forEach(async ({ id, bus }) => {
      if(sockets[ bus.id ]) {
        console.log(`It's about to send ride => ${ id } to bus => ${ bus.id }`)

        const rid = await Ride.aggregate([
          { $match : { id }},
          { 
            $group : {
              _id : {
                month : { $month : '$date' },
                date : { $dayOfMonth : '$date' },
                year : { $year : '$date' }
            },
              body : { $push : '$$ROOT' }
            }
          },
        ])

        const d = filterAggregate(rid, getRideData, 'asc')

        sockets[ bus.id ].emit('new ride', { ride : d })
      }
    })

    return ctx.body = { ok : true, data : null, message : '' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error dispatching rides!' }

  // if(sockets[ bus ]) {
  //   try {
  //     const { socket, user } = sockets[ bus ]

  //     if(socket) {
  //       // const bs = await Bus.findOne({ id : bus }, { active : 1, _id : 0 })
  //       const rid = await Ride.findOne({ id : ride })

  //       if(rid) {
  //         console.log(`About to send data to socket ${ JSON.stringify(user) }`)
  //         // console.log(filterDoc(rid._doc))
  //         socket.emit('new ride', filterDoc(rid._doc))
  //       }
  //     }
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }

  // return ctx.body = 'ok'
})

export default rideRouter