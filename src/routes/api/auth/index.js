import Router from 'koa-router'
import passport from 'koa-passport'

import { ALLOWED_USERS } from '../../../config'
import { User, Bus } from '../../../models'

const auth = new Router({ prefix : 'auth' })

const setUserData = async usr => {
  const getBusId = async user => {
    try {
      const { id } = await Bus.findOne({ user }, { id : 1, _id : 0 })

      return id
    } catch (e) {
      console.log(`Driver with username {${ usr.username }} attempted to login with no bus assigned.`)
    }

    return -1
  }

  const data = {
    username : usr.username,
    lastSession : usr.lastSession,
  }

  if(usr.position === 'DRIVER' ) data.busId = await getBusId(usr._id)

  return data
}

const isAuthenticated = async (ctx, next) => {
  try {
    if(ctx.isAuthenticated()) {
      const { user } = ctx.state
    
      const data = await setUserData(user)
    
      return ctx.body = { ok : true, data : { userInfo : data }, message : '' }
    }
  } catch (e) {
    console.log(e)
  }

  return next()
}

auth.post('/login', isAuthenticated, ctx =>
  passport.authenticate('local', async (err, user, msg) => {
    const { driverToken } = ctx.request.body

    if(user) {
      if(driverToken && user.position !== 'DRIVER') return ctx.body = { ok : false, data : null, message : 'Not a valid Driver' }
      else if(!driverToken && !ALLOWED_USERS.includes(user.position)) return ctx.body = { ok : false, data : null, message : 'You are not authorized to log in. Contact an Admin.' }

      await User.findByIdAndUpdate(user, { lastSession : Date.now() })
      await ctx.login(user)

      const data = await setUserData(user)

      return ctx.body = { ok : true, data : { userInfo : data }, message : '' }
    }

    ctx.status = 401 // unauthorized

    return ctx.body = { ok : false, data : null, message : msg }
  })(ctx)
)

// auth.post('/login/driver', isAuthenticated, async ctx => 
//   passport.authenticate('local', async (err, user, msg) => {
//     if(user) {

//     }
//   })
// )

// TODO : give an use to the username
// (for logging or do something if :username wants to log off)
auth.get('/logout', /* isAuthenticated, */ ctx => {
// auth.get('/logout/:username', isAuthenticated, ctx => {
  // const { username } = ctx.params

  if(ctx.state.user) {
    console.log(`${ ctx.state.user.username } is logging out...`)
    ctx.logout()

    return ctx.body = { ok : true, data : null, message : 'User logged out' }
  }

  return ctx.body = { ok : false, data : null, message : '' }
})

auth.get('/check-auth', ctx => {
  // console.log(ctx.session)
  // console.log(`User is ${ ctx.isAuthenticated() ? '' : 'not' } authenticated`)

  if(ctx.isAuthenticated()) {
    const { username, lastSession } = ctx.state.user

    const data = {
      username,
      lastSession
    }

    return ctx.body = { ok : true, data : { userInfo : data }, message : '' }
  }

  return ctx.body = { ok : false, data : null, message : 'There is no saved session available' }
})

export default auth