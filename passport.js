import passport from 'koa-passport'

import { Strategy } from 'passport-local'

import { User } from './src/models'

passport.serializeUser((user, done) => {
  console.log('About to authenticate: ', user.username)

  return done(null, user._id)
})

passport.deserializeUser(async (_id, done) => {
  try {
    const user = await User.findById({ _id })

    return done(null, user)
  } catch (e) {
    return done(e)
  }
})

passport.use('local', new Strategy({
  usernameField : 'username',
  passwordField : 'password',
}, async (username, password, done) => {
  try {
    // console.log(username, password)
    const user = await User.findOne({ username })

    if(user) {
      // If password is not valid
      if(!user.validPassword(password)) return done(null, false, 'Invalid password')

      user.updateLastSession()

      return done(null, user)
    }

    // If user doesn't exist
    return done(null, false, 'User doesn\'t exist')
  } catch (e) {
    return done(e)
  }
}))