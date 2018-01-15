import Router from 'koa-router'

import auth from './auth'
// import route from './route'
import ticket from './ticket'
import user from './user'
import ride from './ride'
import bus from './bus'

const api = new Router({ prefix : 'api/v1' })

const apiRoutes = [
  // route,
  ticket,
  auth,
  user,
  ride,
  bus,
]

// Combine all routes to api
apiRoutes.forEach(route => {
  api.use('/', route.routes(), route.allowedMethods())
})

export default api