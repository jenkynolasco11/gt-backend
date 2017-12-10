import mocha from 'mocha'
import chai, { assert, expect, should as s } from 'chai'
import chaiPromse from 'chai-as-promised'
import chaiHttp from 'chai-http'
import app from '../appTest'

// import server from '../app'
// const server = require('../app').default
chai.use(chaiHttp)

const should = s()
// let app = null

describe('Server => ', () => {
  before(async () => {
    console.log(app)
  })

  it('Should run...', done => {
    chai
      .request(app)
      .get('/')
      .end((err, res) => {
        console.log('it got into here')
        done()
      })
  })

  after(() => {
    // console.log(server)
    process.exit()
  })
})
// describe('Rides', () => {
//   before(async () => {
//     try {
//       server = await require('../app').default
//       console.log(server)
//     } catch(e) {

//     }
//   })

//   it('Should return an array of rides', async done => {
//     try {
//       // console.log(server)
      
//       const srvr = await chai.request(server)
//       // console.log(srvr)
//       const req = await srvr.get('/api/v1/ride/all')
//       const res = await req.end()

//       res.should.have.status(200)
//       done()
//     } catch (e) {
//       done(e)
//     }
//   })

//   after(done => {
//     server.close(done)
//   })
// })