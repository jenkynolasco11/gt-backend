export default async (ctx, next) => {
  try {
    await next()
    const status = ctx.status || 404

    if(status === 404) {
      ctx.status = 404
      ctx.body = { 'status' : 'error...' }

      return ctx.throw(404)
    }

    return console.log('If this works, 404 is not working properly...')
  } catch (e) {
    ctx.throw(e)
    ctx.app.emit('error', e, ctx)
    // console.log('Where you going, duffo? (app.js)')
    // ctx.status = err.status || 404
    // if(ctx.status === 404) render 404 <==
    return
  }
}