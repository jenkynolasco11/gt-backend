import SocketIo from 'socket.io'
import { Bus } from './models'

export const sockets = {}

export const socketServer = app => {
  const sckts = new SocketIo(app)

  sckts.on('connection', socket => {
    socket.on('new connection', async msg => {
      const { bus, user, active } = msg

      console.log(`We received ${ JSON.stringify(msg) }`)

      // console.log(sockets, bus, sockets[ bus ])
      if(sockets[ bus ]) delete sockets[ bus ]

      try {
        const bs = await Bus.findOneAndUpdate({ id : bus }, { active }, { new : true })

        if(bs) sockets[ bus ] = { socket, user }

        else console.log(`Bus with ID ${ bus } does not exist...`)
      } catch(e) {
        console.log(e)
      }
      // sockets[ bus ].send('added', { this : 'works' })
    })

    socket.on('disconnect', async () => {
      for(const id in sockets)
        if(socket.id === sockets[ id ].socket.id) {
          try {
            await Bus.findOneAndUpdate({ id }, { active : false })
            console.log(`about to delete ${ id } socket`)
          } catch (e) {
            console.log(e)
          }
          delete sockets[ id ]
        }
    })
  })
}