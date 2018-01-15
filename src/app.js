import Koa from 'koa'
import http from 'http'
import logger from 'koa-logger'
import bodyparser from 'koa-body'
import Pug from 'koa-pug'
import mongoose from 'mongoose'
import serve from 'koa-static'
// import session from 'koa-session-minimal'
import session from 'koa-session'
// import SessionStore from 'koa-session-mongoose'
import bluebird from 'bluebird'
import passport from 'koa-passport'
import cors from 'koa2-cors'

import { socketServer } from './socket.io-server'
import config from './config'
import routes from './routes'
import error404 from './routes/404'

import { createMeta } from './models'
import './passport'

// Assign better Promise to global/mongoose
global.Promise = bluebird.Promise
mongoose.Promise = bluebird.Promise

const server = async (port, done) => {
  try {
    await mongoose.connect(config.DBURI, { useMongoClient : true })
    await createMeta(false)

    const app = new Koa()

    // Views Config
    const pug = new Pug({
      debug : false,
      pretty : false,
      compileDebug : false,
      noCache : false, // TODO : Remove this in production
      viewPath : './src/public/views',
      app,
    })

    // Sessions Config
    // const store = new SessionStore()

    const sessionParams = {
      key : config.KEY,
      // httpOnly : true,
      // store,
    }

    app.keys = config.KEYS

    app
      .use(bodyparser({ multipart : true }))
      .use(session(sessionParams, app))
      .use(cors({ 
        origin : () => '*',
        // credentials : true,
        exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control']
      }))
      .use(serve('./src/public/assets'))
      .use(passport.initialize())
      .use(passport.session())
      .use(logger())
      .use(routes)
      .use(error404)

    const PORT = (port || process.env.PORT || config.PORT)

    const application = http.createServer(app.callback())
    const srvr = await application.listen(PORT)

    console.log(`Started server at ${ PORT }`)

    socketServer(application)

    if(done) done()

    return srvr
  } catch (e) {
    console.log(e)
    process.exit()
  }

  return null
}

export default server