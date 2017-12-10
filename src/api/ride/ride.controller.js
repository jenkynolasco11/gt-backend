// import {  } from 'mongoose'
import { Meta, Ride, RideDetail, Bus, BusDetail } from '../../models'
// import { formatDate, formatHour } from '../../utils'

export const getRideData = async ride => {
  try {
    const { routeTo, routeFrom, bus, status, time, date } = ride

    let buss = null
    let busDetails = null
    let seatsUsed = null
    let luggageUsed = null

    const { seatsOccupied, luggage } = await RideDetail.findOne({ ride : ride._id })

    if(bus) {
      buss = await Bus.findById(bus)

      busDetails = await BusDetail.findOne({ bus })

      const seat = parseInt(busDetails.seats) - parseInt(seatsOccupied)
      const lug = parseInt(busDetails.luggage) - parseInt(luggage)
      seatsUsed = seat < 0 ? 0 : seat
      luggageUsed = lug < 0 ? 0 : lug
    } else {
      seatsUsed = seatsOccupied
      luggageUsed = luggage
    }

    const data = {
      // id : ride._id,
      id : ride.id,
      bus : bus ? {
        id : buss._id,
        alias : buss.alias,
        name : buss.name,
        status : buss.status,
        seats : busDetails.seats,
        luggage : busDetails.luggage,
      } : null,
      status,
      routeTo,
      routeFrom,
      time, // : nTime,
      date, // : nDate,
      seatsUsed,
      luggageUsed,
    }
    
    // TODO : CHECK THIS OUT LATER
    return data//.filter(Boolean)
  } catch (e) {
    console.log(e)
    process.exit()
  }

  return null
}

export const saveRide = async data => {
  const {
    bus = null,
    routeTo,
    routeFrom,
    status,
    time,
    date,
    luggage = 0,
    seatsOccupied = 0
  } = data

  try {
    const meta = await Meta.findOne({})

    // console.log(meta._doc)

    const rid = await new Ride({
      id : meta.lastRideId,
      bus : bus ? bus : null,
      routeTo,
      routeFrom,
      time,
      // date : new Date(date).setHours(0,0,0,0).toISOString(),
      date,
      status : status ? status.toUpperCase() : 'PENDING'
    }).save()

    const details = await new RideDetail({
      ride : rid._id,
      seatsOccupied,
      luggage,
    }).save()

    meta.lastRideId += 1
    await meta.save()

    return rid.id
  } catch (e) {
    console.log(e)
  }

  return null
}

export const updateRide = async (id, body) => {
  try {
    // console.log(body)
    const {
      routeTo,
      routeFrom,
      status,
      time,
      date,
      luggage = 0,
      seatsOccupied = 0,
    } = body

    // console.log(body.bus)

    const bus = body.bus ? body.bus : null

    const data = {
      bus,
      routeTo,
      routeFrom,
      status,
      // date : (new Date(date)).setHours(0,0,0,0).toISOString(), 
      date,
      time,
    }

    const rid = await Ride.findOneAndUpdate({ id }, data /*, { new : true }*/)
    const details = await RideDetail.findOneAndUpdate({ ride : rid._id }, { luggage, seatsOccupied })

    return rid.id
  } catch (e) {
    console.log(e)
  }
  return null
}
