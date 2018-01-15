import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt-nodejs'

const userStatus = [ 'ACTIVE', 'INACTIVE', 'DISABLED', 'DELETED' ]

const UserSchema = new Schema({
  person : { type : Schema.Types.ObjectId, ref : 'person', required : true, unique : true },
  username : { type : String, index : { unique : true }},
  password : { type : String, required : true },
  // permissions : [{ type : String, enum : [ 'create', 'replace', 'update', 'delete' ] }],
  position : {
    type : String,
    default : 'NONE',
    enum :  [ 'SUPERUSER', 'DRIVER', 'MANAGER', 'DISPATCHER', 'NONE' ],
  },
  status : { type : String, enum : userStatus, default : 'ACTIVE', required : true, index : true },
  createdAt : { type : Date, default : Date.now },
  modifiedAt : { type : Date, default : Date.now },
  lastSession : { type : Date, required : true, default : Date.now }
})

UserSchema.methods.generateHash = function(password){ 
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null) 
}

UserSchema.methods.validPassword = function(password){ 
  const isValid = bcrypt.compareSync(password, this.password) 
  // console.log(`Password is ${ isValid ? 'valid' : 'not valid' }`)
  return isValid
}

UserSchema.methods.updateLastSession = function() {
  this.lastSession = Date.now()
  this.save()
}

UserSchema.pre('update', function(next) {
  this.modifiedAt = Date.now()

  next()
})
// UserSchema.pre('save', function(next) {  
//   this.password = this.generateHash(this.password)
//   next()
// })

export default mongoose.model('user', UserSchema, 'user')