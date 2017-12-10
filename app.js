import Koa from 'koa'
import logger from 'koa-logger'
import bodyparser from 'koa-body'
import Pug from 'koa-pug'
import mongoose from 'mongoose'
import serve from 'koa-static'
import session from 'koa-session'
import SessionStore from 'koa-session-mongoose'
import bluebird from 'bluebird'
import passport from 'koa-passport'
import cors from 'koa2-cors'

import config from './config'
import routes from './src/api'
import error404 from './src/api/404'

import './passport'

// Assign better Promise to global/mongoose
global.Promise = bluebird.Promise
mongoose.Promise = bluebird.Promise

const server = async done => {
  try {
    await mongoose.connect(config.DBURI, { useMongoClient : true })
    
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
      // keys : config.SESSIONID,
      // store,
    }

    app.keys = config.KEYS

    app
      .use(cors({ 
        origin : () => '*',
        // credentials : true,
        // allowHeaders : [ 
        //   'Origin', 'X-Requested-With', 'Content-Type', 'Accept'
        // ]
      })) // Security | Modify access to server via http(s)
      .use(bodyparser({ multipart : true }))
      .use(serve('./src/public/assets'))
      .use(session(sessionParams, app))
      .use(passport.initialize())
      .use(passport.session())
      .use(logger())
      .use(routes)
      .use(error404)

    const PORT = (process.env.PORT || config.PORT)

    await app.listen(PORT)

    console.log(`Started server at ${ PORT }`)

    return app
  } catch (e) {
    console.log(e)
    process.exit()
  }
}

server()