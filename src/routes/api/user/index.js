import Router from 'koa-router'

import { User } from '../../../models'
import { createUser, getUserData, updateUser } from './user.controller'

const userRouter = new Router({ prefix : 'user' })

userRouter.get('/all', async ctx => {
  try {
    const data = await User.find({})

    if(data) return ctx.body = { ok : true, data : { users : data }, message : '' }

    return ctx.body = { ok : false, data : null, message : 'There are no users to show' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error while retrieving the users' }
})

userRouter.get('/:username', async ctx => {
  const { username } = ctx.params

  try {
    const user = await User.findOne({ username })

    if(user) {
      const data = await getUserData(user)

      if(data) return ctx.body = { ok : true, data : { user : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There is no user under that username' }
  } catch(e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error while retrieving the user' }
})

userRouter.post('/save', async ctx => {
  const { body } = ctx.request

  try {
    const username = await createUser(body)

    if(username) return ctx.body = { ok : true, data : { username }, message : '' }

    return ctx.body = { ok : false, data : null, message : 'Couldn\'t save user on Database' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error while creating the user' }
})

userRouter.put('/:username/modify', async ctx => {
  const { username } = ctx.params
  const { body } = ctx.request

  try {
    const user = await User.findOne({ username })

    if(user) {
      const data = await updateUser(user, body)

      if(data) return ctx.body = { ok : true, data : { user : data }, message : '' }
    }

    return ctx.body = { ok : false, data : null, message : 'There is no username under than name' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error while updating the user' }
})

userRouter.put('/:username/delete', async ctx => {
  const { username } = ctx.params

  try {
    const usr = await User.findOneAndUpdate({ username }, { status : 'DELETED' }, { new : true })

    if(usr.status === 'DELETED') return ctx.body = { ok : true, data : null, message : 'User deleted successfully!' }

    return ctx.body = { ok : false, data : null, message : 'Couldn\'t delete user' }
  } catch (e) {
    console.log(e)
  }

  return ctx.body = { ok : false, data : null, message : 'Error while deleting the user' }
})

export default userRouter