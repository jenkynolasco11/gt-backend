// Tempting to rename CRUD

import {
  Person,
  Address,
  // Bus,
  // BusDetail,
  // Payment,
  // Ride,
  // RideDetail,
  // Ticket,
  // TicketDetail,
  // User
 } from '../models'

export const createPerson = async ({ firstname, lastname, email, phoneNumber }) => {
  try {
    let person = await Person.findOne({ phoneNumber })
    if(!person) person = await new Person({ firstname, lastname, email, phoneNumber }).save()

    return person._id
  } catch (e) {
    return null
  }
}

export const createAddress = async ({ street, state, zipcode, city }) => {
  try {
    let address = await Address.findOne({ street, state, zipcode, city })
    if(!address) address = await new Address({ street, state, zipcode, city }).save()

    return address._id
  } catch (e) {
    return null
  }
}

// Remove non wanted fields
export const filterDoc = doc => {
  if(doc === 'none') return doc
  const { _id, __v, modifiedAt, createdAt, ...rest }  = doc

  return rest
}