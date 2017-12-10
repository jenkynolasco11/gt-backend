import mongoose, { Schema } from 'mongoose'
// import UUID from 'uuid/v4'
// import bcrypt from 'bcrypt-nodejs'

const routes = [ 'NY', 'PA' ]
const status = [ 'USED', 'REDEEMED', 'NULL', 'NEW', 'DELETED' ]

const TicketSchema = new Schema({
  id : { type : Number, required : true, unique : true, index : true },
  person : { type : Schema.Types.ObjectId, ref : 'person', required : true, index : true }, // Doesnt need index
  ride : { type : Schema.Types.ObjectId, ref : 'ride', index : true, default : null }, // Should also be unique, Doesnt need index
  receipt : { type : Schema.Types.ObjectId, ref : 'receipt', required : true, index : true }, // Should also be unique, Doesnt need index
  details : { type : Schema.Types.ObjectId, ref : 'ticketDetail', required : true, index : true }, // Should also be unique, Doesnt need index
  status : { type : String, index : true, enum : status },
  // luggage : { type : Number, default : 0 },
  willPick : { type : Boolean, default : false, index : true },
  willDrop : { type : Boolean, default : false, index : true },
  //////****//
  from : { type : String, enum : routes, index : true },
  to : { type : String, enum : routes, index : true },
  //////////
  createdAt : { type : Date, default : Date.now },
  modifiedAt : { type : Date, default : Date.now },
  time : { type : Number, required : true, index : true },
  date : { type : Date, required : true, index : true },
})

const TicketDetailsSchema = new Schema({
  pickUpAddress : { type : Schema.Types.ObjectId, ref : 'address', index : true },
  dropOffAddress : { type : Schema.Types.ObjectId, ref : 'address', index : true },
  redeemedCount : Number,
  // fee : { type : Number, default : 0 },
  // extraFee : { type : Number, default : 0 },
  createdAt : { type : Date, default : Date.now },
  modifiedAt : { type : Date, default : Date.now },
})

// [ TicketSchema, TicketDetailSchema ].forEach(schema => {
//   schema.pre('save', function(next) {
    
//   })
// })

TicketSchema.pre('save', function(next){
  // console.log(this)
  this.modifiedAt = Date.now()
  next()
})

TicketDetailsSchema.pre('save', function(next){
  // console.log(this)
  this.modifiedAt = Date.now()
  next()
})

export const Ticket = mongoose.model('ticket', TicketSchema, 'ticket')
export const TicketDetail = mongoose.model('ticketDetail', TicketDetailsSchema, 'ticketDetail')