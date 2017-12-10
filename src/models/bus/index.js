import mongoose, { Schema } from 'mongoose'

const BusSchema = new Schema({
  id : { type : Number, index : true, unique : true, required : true },
  user : { type : Schema.Types.ObjectId, ref : 'user' },
  alias : String,
  name : String,
  status : {
    type : String,
    enum : [ 'STANDBY', 'OK', 'DAMAGED', 'RETIRED', '' ]
  },
  // seats : Number,
  // luggage : Number,
  createdAt : { type : Date, default : Date.now },
  modifiedAt : { type : Date, default : Date.now }
})

const BusDetailSchema = new Schema({
  bus : { type : Schema.Types.ObjectId, ref : 'bus', index : true, unique : true },
  seats : { type : Number, default : 0 },
  luggage : { type : Number, default : 0 },
  modifiedAt : { type : Date, default : Date.now }
})

BusSchema.pre('save', function(next) {
  this.modifiedAt = Date.now()
  next()
})

BusDetailSchema.pre('save', function(next) {
  this.modifiedAt = Date.now()
  next()
})

export const Bus = mongoose.model('bus', BusSchema, 'bus')
export const BusDetail = mongoose.model('busDetail', BusDetailSchema, 'busDetail')