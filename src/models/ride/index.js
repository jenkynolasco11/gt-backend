import mongoose, { Schema } from 'mongoose'

const routes = [ 'NY', 'PA' ]
const status = [ 'FINISHED', 'PENDING', 'ASSIGNED', 'ON-THE-WAY', 'CANCELLED' ]

const RideSchema = new Schema({
  id : { type : Number, index : true, required : true },
  bus : { type : Schema.Types.ObjectId, ref : 'bus', index : true },
  frm : { type : String, enum : routes, required : true },
  to : { type : String, enum : routes, required : true },
  status : { type : String, enum : status, index : true, default : 'PENDING' },
  time : { type : Number, default : -1 },
  date : { type : Date },
  createdAt : { type : Date, default : Date.now },
  modifiedAt : { type : Date, default : Date.now },
})

const RideDetailsSchema = new Schema({
  ride : { type : Schema.Types.ObjectId, ref : 'ride', index : true },
  seatsOccupied : { type : Number, default : 0 },
  luggage : { type : Number, default : 0 },
  createdAt : { type : Date, default : Date.now },
  modifiedAt : { type : Date, default : Date.now }
})

RideSchema.pre('save', function(next) {
  this.modifiedAt = Date.now()
  next()
})

RideDetailsSchema.pre('validate', function(next) {
  this.modifiedAt = Date.now()
  next()
})

export const Ride = mongoose.model('ride', RideSchema, 'ride')
export const RideDetails = mongoose.model('rideDetails', RideDetailsSchema, 'rideDetails')