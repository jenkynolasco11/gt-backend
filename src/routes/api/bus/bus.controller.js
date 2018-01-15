import { BusDetail, Bus, User, Person, Meta } from '../../../models'

const eraseAll = async objects => {
  const { bus, details } = objects

  try {
    if(bus) await Bus.findByIdAndRemove(bus._id)
    if(details) await BusDetail.findByIdAndRemove(details._id)
  } catch (e) {
    return false
  }

  return true
}

export const getBusData = async bus => {
  const { _id, user, id, name, status } = bus

  try {
    const { seats, luggage } = await BusDetail.findOne({ bus : _id })

    const data = {
      id,
      name,
      driver : 'none',
      status,
      seats,
      luggage
    }

    if(user) {
      const { person, position } = await User.findById(user)
      const { firstname, lastname, phoneNumber } = await Person.findById(person)

      const driver = { firstname, lastname, phoneNumber, position }

      data.driver = driver
    }

    return data
  } catch (e) {
    console.log(e)
  }

  return null
}

export const saveBus = async data => {
  let bus = null
  let details = null

  try {
    const meta = await Meta.findOne({})
    const { lastBusId } = meta

    const {
      user,
      name,
      status = 'STANDBY',
      seats,
      luggage,
    } = data

    bus = await new Bus({
      id : lastBusId,
      user,
      name,
      status
    }).save()

    details = await new BusDetail({
      bus : bus._id,
      seats,
      luggage
    }).save()

    meta.lastBusId += 1
    await meta.save()

    return bus.id
  } catch (e) {
    await eraseAll({ bus, details })
    console.log(e)
  }

  return null
}

export const updateBus = async (buss, body) => {
  let details = null
  let bus = null

  const { _id, __v, createdAt, modifiedAt, id, ...busx } = buss.toObject()

  const data = { ...busx, ...body }

  try {
    // console.log(data)
    bus = await Bus.findByIdAndUpdate(_id, data, { new : true })
    details = await BusDetail.findOneAndUpdate({ bus : bus._id }, data)

    return await getBusData(bus)
  } catch (e) {
    eraseAll({ details, bus })
    console.log(e)
  }

  return null
}