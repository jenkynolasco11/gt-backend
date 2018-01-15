import mongoose, { Schema } from 'mongoose'

const MetaSchema = new Schema({
  lastReceiptId : { type : Number, default : 1 },
  lastPackageId : { type : Number, default : 1 },
  lastTicketId : { type : Number, default : 1 },
  lastRideId : { type : Number, default : 1 },
  lastBusId : { type : Number, default : 1 },
  modifiedAt : { type : Number, default : Date.now }
})

MetaSchema.pre('save', function(next) {
  this.modifiedAt = Date.now()

  next()
})

export default mongoose.model('meta', MetaSchema, 'meta')