import Router from 'koa-router'

import { User, Person } from '../../models'

const userRouter = new Router({ prefix : 'user' })

const getUserData = async data => {
  try {
    
  } catch (e) {
    console.log(e)
  }

  return null
}

userRouter.get('/all', async ctx => {
  const { limit = 10, skip = 0 } = ctx.query

  try {
    const users = await User.find({})
                          .skip(skip)
                          .limit(limit)
                          .exec()

    if(users.length) {

    }
    // const query = await User.find({ position : type })
    //                         .skip(Number(skip))
    //                         .limit(Number(limit))
    //                         .exec()

    // const count = await User.count({ position : type })

    return ctx.body = { ok : true, data : { users, count }, message : null }
  } catch (e) {
    return ctx.body = { data : null, message : 'Error retrieving users' }
  }
})

userRouter.get('/current', async ctx => {
  if(!ctx.state.user) return ctx.body = { 
    data : null,
    message : 'Error. There is no logged in user.'
  }

  const { personid = null } = ctx.state.user
  
  try {
    const { firstname, lastname } = await Person.findById(personid)

    return ctx.body = { data : { firstname, lastname }, message : null }
  } catch (e) {
    return ctx.body = {
      data : null,
      message : 'Error retrieving logged user. Are you logged in?'
    }
  }
})

userRouter.post('/create-or-update', async ctx => {
  // IF PERSON EXISTS, UPDATE
  const {
    uid = '',
    pid = '',
    username,
    firstname,
    lastname,
    password,
    phoneNumber,
    position = 'NONE'
  } = ctx.request.body

  try {
    const p = await Person.findById(pid)
    const u = await User.findById(uid)

    if(p) {
      await Person.update({ _id : pid }, {
        firstname,
        lastname,
        phoneNumber
      })

      const pass = u.generateHash(password)

      await User.update({ _id : uid }, {
        username,
        password : pass,
        position
      })

      return ctx.body = { data : true, message : 'User saved satisfactorily!' }
    }
    // else {

    const person = await new Person({
      firstname,
      lastname, 
      phoneNumber
    }).save()

    const usr = new User({
      username,
      position,
      personid : person._id,
    })

    usr.password = usr.generateHash(password)

    await usr.save()

    return ctx.body = { data : true, message : '' }
    // }
  } catch (e) {
    return ctx.body = { 
      data : null, 
      message : 'Error while saving the user to the DB' 
    }
  }
})

export default userRouter