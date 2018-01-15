import { Meta, Ride, RideDetail, Bus, BusDetail, Ticket } from '../../../models'

import { filterDoc } from '../../../utils'

export const createRide = async data => {
  const {
    bus = null,
    to,
    frm,
    status = 'PENDING',
    time,
    date,
    luggage = 0,
    seatsOccupied = 0,
  } = data

  let tempBus = null

  try {
    const meta = await Meta.findOne({})

    if(bus) tempBus = await Bus.findOne({ id : bus })

    const rid = await new Ride({
      id : meta.lastRideId,
      bus : bus ? tempBus._id : null,
      to,
      frm,
      status,
      time : parseInt(time),
      date : new Date(new Date(date).setHours(0,0,0,0)),
    }).save()

    // Not sure if I should leave this with await
    const details = await new RideDetail({
      ride : rid._id,
      seatsOccupied,
      luggage,
    }).save()

    meta.lastRideId += 1
    meta.save()

    return rid.id
  } catch (e) {
    console.log(e)
  }

  return null
}

export const updateRide = async (rid, body) => {
  try {
    const { _id, status, id, bus, ...ride } = filterDoc(rid._doc)
    // const { _id, __v, createdAt, modifiedAt, status, id, bus, ...ride } = rid.toObject()

    const stts = bus
                  ? status === 'PENDING'
                  ? 'ASSIGNED'
                  : status 
                  : 'PENDING'

    const data = { ...ride, bus, status : stts, ...body }

    const rde = await Ride.findOneAndUpdate({ id }, data, { new : true })
    const details = await RideDetail.findOneAndUpdate({ ride : _id }, data)

    return id
  } catch (e) {
    console.log(e)
  }

  return null
}

export const getRideData = async ride => {
  try {
    const { _id, id, bus, to, frm, status, time, date } = ride

    let buss = null
    let busDetails = null

    const { seatsOccupied, luggage } = await RideDetail.findOne({ ride : _id })

    const ticketsCount = await Ticket.count({ ride : _id })

    if(bus) {
      buss = await Bus.findById(bus)
      busDetails = await BusDetail.findOne({ bus })

      // luggageUsed { = parseInt(busDetails.luggage) - parseInt(luggage)
      // seatsUsed = parseInt(busDetails.seats) - parseInt(seatsOccupied)
    // } else {
    //   luggageUsed = luggage
    //   seatsUsed = seatsOccupied
    }

    const busData = bus 
                    ? 
                    {
                      id : buss.id,
                      name : buss.name,
                      status : buss.status,
                      seats : busDetails.seatQty,
                      luggage : busDetails.luggageQty,
                    } 
                    : null

    const data = {
      id,
      bus : busData,
      ticketsCount,
      status, // : status === 'ON-THE-WAY' ? status.split('-').join(' ') : status,
      to,
      frm,
      time,
      date,
      seatsOccupied,
      luggage,
    }

    // TODO : CHECK THIS OUT LATER
    return data
  } catch (e) {
    console.log(e)
    // process.exit()
  }

  return null
}
