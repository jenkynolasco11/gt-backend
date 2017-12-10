import mongoose, { Schema } from 'mongoose'

const PersonSchema = new Schema({
  firstname : { type : String, required : true },
  lastname : { type : String, required : true },
  phoneNumber : { type : String, match : /^\d{10}$/, required : true, index : true, unique : true },
  email : { type : String, index : true, unique : true },
  createdAt : { type : Date, default : Date.now },
  modifiedAt : { type : Date, default : Date.now },
})

PersonSchema.pre('validate', function(next) {
  const { firstname, lastname, phoneNumber } = this
  const [ first ] = firstname.split(' ')
  const [ last ] = lastname.split(' ')
  
  // Validate Phone Number
  // console.log(typeof this.phoneNumber)
  this.firstname = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  this.lastname = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase()
  this.modifiedAt = Date.now()
  next()
})

// PersonSchema.post('save', function(){
//   console.log(this)
// })

export default mongoose.model('person', PersonSchema, 'person')