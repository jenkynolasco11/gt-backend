import mongoose, { Schema } from 'mongoose'

const AddressSchema = new Schema({
  street : String,
  city : String,
  state : String,
  zipcode : Number,
  createdAt : { type : Date, default : Date.now },
  modifiedAt : { type : Date, default : Date.now }
})

AddressSchema.pre('validate', function(next) {
  this.modifiedAt = Date.now()
  next()
})

export default mongoose.model('address', AddressSchema, 'address')