import mongoose, { Schema } from 'mongoose'

const PackageSchema = new Schema({
  // id : { type : Number, index : { unique : true }},
  // person : { type : Schema.Types.ObjectId, ref : 'person' },
  weight : { type : Number, default : 0 },
  message : String,
  fee : { type : Number, default : 0 },
  createdAt : { type : Date, default : Date.now },
})

// MetaSchema.pre('save', function(next) {
//   this.modifiedAt = Date.now()
//   next()
// })

export default mongoose.model('package', PackageSchema, 'package')