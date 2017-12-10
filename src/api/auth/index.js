import Router from 'koa-router'
import passport from 'koa-passport'
import { ALLOWED_USERS } from '../../../config'

const auth = new Router({ prefix : 'auth' })

const isAuthenticated = (ctx, next) => {
  if(ctx.isAuthenticated()) return next()

  return ctx.body = { ok : false }
}

/** *******************************************************************
 *   WARNING!!!!!!!!!!
******************************************************************** */
// auth.get('/', isAuthenticated, ctx => {
//   const script = '/js/login.js'
//   const params = { title : 'login', description : 'duh', script }

//   // ..... Create more query errors depending the situation
//   return ctx.render('login', params)
// })
/* ***************************************************************** */

auth.post('/login', /*isAuthenticated,*/ ctx => (
  passport.authenticate('local', {
    successRedirect : '/admin/dashboard',
    failureRedirect : '/admin/auth?valid=false',
  }, async (err, user, msg, done) => {
    if(user) {
      console.log(user)
      // TODO : Alter session last time connected in here
      if(!ALLOWED_USERS.includes(user.position)) return ctx.body = { ok : false, msg : 'You are not authorized to log in. Contact an Admin.' }

      await ctx.login(user)

      const data = {
        username : user.username,
        lastSession : user.lastSession,
        personId : user.personId
      }

      return ctx.body = { ok : true, data, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : msg }
  })(ctx))
)

auth.get('/logout', ctx => {
  if(!ctx.state.user) return ctx.body = { data : { ok : true }, message : '' }

  console.log(`${ ctx.state.user.username } is logging out...`)
  ctx.logout()

  return ctx.body = { data : { ok : true }, message : '' }
})

auth.get('/check-auth', ctx => {
  const ok = ctx.isAuthenticated()

  return ctx.body = { 
    ok,
    [ ok ? 'data' : 'message' ] : ok ? ctx.state.user : 'No user authenticated'
  }
})

export default auth