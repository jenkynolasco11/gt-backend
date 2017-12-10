import mongoose from 'mongoose'

import './user'
import './ride'
import './ticket'
import './person'
import './address'
import './bus'
import './receipt'
import './meta'

// // Insert some mock data!!!!!
// import './mockupData'

mongoose.Promise = global.Promise

export const Person = mongoose.model('person')
export const User = mongoose.model('user')
export const Ride = mongoose.model('ride')
export const RideDetail = mongoose.model('rideDetail')
export const Ticket = mongoose.model('ticket')
export const TicketDetail = mongoose.model('ticketDetail')
export const Address = mongoose.model('address')
export const Bus = mongoose.model('bus')
export const Receipt = mongoose.model('receipt')
export const BusDetail = mongoose.model('busDetail')
export const Meta = mongoose.model('meta')

/* const meta = */
Meta.findOne({}).then(doc => {
  if(!doc)

    // Default meta data
    return new Meta({
      lastReceiptId : 1,
      lastTicketId : 1,
      lastRideId : 1,
      lastBusId : 1,
    }).save()

  return null
})

export default {
  Person,
  Ride,
  Ticket,
  TicketDetail,
  Address,
  User,
  Bus,
  Receipt,
  BusDetail,
  RideDetail,
  Meta
}