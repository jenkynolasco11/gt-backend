import Router from 'koa-router'

// import auth from './auth'
// import user from './user'
// import route from './route'
import ride from './ride'
import ticket from './ticket'
import bus from './bus'
import receipt from './receipt'

const api = new Router({ prefix : 'api/v1' })
const rootRoute = new Router({ prefix : '' })

const apiRoutes = [
  // route,
  // auth,
  // user,
  receipt,
  ticket,
  ride,
  bus,
]

// Combine all routes to api
apiRoutes.forEach(route => {
  api.use('/', route.routes(), route.allowedMethods())
})

rootRoute.use('/', api.routes(), api.allowedMethods())

// Allow to respond with error!
// rootRoute.use(error404)

/** *******************************************************************
 *   WARNING!!!!!!!!!!
******************************************************************** */
/** ********* TODO : Uncomment this after finishing frontend *********/
// rootRoute.use('/', admin.routes(), admin.allowedMethods())

// rootRoute.get('/', ctx => {
//   // TODO : Reconsider this redirect in here
//   if(ctx.isAuthenticated()) return ctx.redirect('/admin/dashboard')
//   return ctx.redirect('/admin/auth')
// })
/** ******************************************************************/

// rootRoute.stack.forEach(p => console.log(p.path, p.methods ))

export default rootRoute.routes()