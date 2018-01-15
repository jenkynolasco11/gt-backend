import mongoose from 'mongoose'
import config from '../config'

mongoose.connect(config.DBURI, { useMongoClient : true }, async () => {
  console.log('Connected to the DB')
/*
  // mongoose.set('debug', true)

  // ///////////////////////////////////////////////////////
  // WARNING!!! THIS DELETES ALL COLLECTIONS!!!!
  // ///////////////////////////////////////////////////////
  // Object.keys(mongoose.connection.collections).forEach(async coll => {
  //   const collection = mongoose.connection.collection[ coll ]

  //   await collection.dropIndexes()
  //   await collection.remove({})
  //   await collection.drop()
  // })
  // console.log('\n\n')
  // console.log('All collections deleted!~')
  // console.log('\n\n')

  // console.log(Object.keys(mongoose.connection.collections))
  ///////////////////////////////////////////////////////////
*/
  require('./user')
  require('./ride')
  require('./ticket')
  require('./person')
  require('./address')
  require('./bus')
  require('./receipt')
  require('./meta')
  require('./package')

  mongoose.Promise = global.Promise

  const addresses = require('./mockupData-streets').default
  const users = require('./mockupData-users').default
  const packageInfo = require('./mockupData-package').default

  const Person = mongoose.model('person')
  const User = mongoose.model('user')
  const Ride = mongoose.model('ride')
  const Ticket = mongoose.model('ticket')
  const TicketDetail = mongoose.model('ticketDetails')
  const Address = mongoose.model('address')
  const Bus = mongoose.model('bus')
  const BusDetail = mongoose.model('busDetails')
  const Payment = mongoose.model('receipt')
  const RideDetail = mongoose.model('rideDetails')
  const Meta = mongoose.model('meta')
  const Package = mongoose.model('package')

  const genRand = (limit, x = 0, isFloat = false) => {
    const rand = Math.random() * limit

    if(!isFloat) return Math.floor(rand) + x

    return rand + x
  }
  const genRandDate = (start, end) => {
    const date = new Date(+start + Math.random() * (end - start))
    // const hour = startHour + Math.random() * (endHour - startHour) | 0
    // date.setHours(hour)
    date.setHours(0,0,0,0)
    // console.log(date)
    return date.toISOString()
  }

  const limit = (lim = 100) => genRand(lim, 1)
  const today = new Date()
  const getAnyDate = () => {
    const a = genRandDate(today, new Date(today.setDate( today.getDate() + 21)))
    // console.log(a.toDateString())
    return new Date(a)
  }

  const ticketLimit = genRand(2000, 1000)
  const peopleLimit = genRand(500, 300)
  const addressLimit = genRand(40,30)
  const rideLimit = genRand(150, 100)
  let driversLimit = 4

  const ticktsStatus = [ 'USED', 'REDEEMED', 'NULL', 'NEW', 'DELETED' ]
  const positions = [ 'DRIVER', 'MANAGER', 'DISPATCHER' ]
  const busStatus = [ 'STANDBY', 'OK', 'DAMAGED', 'DISABLED' ]
  const busNames = [ 'Blanquita', 'Rocio', 'Maria la del Barrio', 'Calle 14', 'Vasito Verde', 'La Negra' ]
  const cardAffiliates = [ 'VISA', 'MASTERCARD', 'AMERICAN EXPRESS', 'DISCOVERY' ]
  const payType = [ 'CASH', 'CARD' ]
  const routes = [ 'NY', 'PA' ]
  const rideStatus = [ 'FINISHED', 'PENDING', 'ASSIGNED', 'ON-THE-WAY', 'CANCELLED' ]
  const times = [ 3, 5, 7, 9, 11, 13, 15, 17, 20, 22 ]
  const rideTimes = []

  const usersLimit = 50
  const addLen = addresses.length

  const meta = {
    lastReceiptId : 1,
    // lastPackageId : 1,
    lastTicketId : 1,
    lastRideId : 1,
    lastBusId : 1,
  }

  const getRandCard = () => cardAffiliates[ genRand(cardAffiliates.length) ]

  // ///////////////////////////////////////
  //#region 
  const createPerson = async (fn, ln, email, num ) => {
    try {
      const phone = num.replace(/\D/g, '')
      
      const person = await new Person({
        firstname : fn,
        lastname : ln,
        phoneNumber : phone,
        email,
      }).save()
  
      return person._id
    } catch (e) {
      console.log('shit happened at Person')
      // console.log(e)
      // throw new Error(`Person =====> ${ JSON.stringify(e) }`)
    }
    return null
  }

  const createUser = async (id, user, pass, pos) => {
    try {
      const usl = new User({
        person : id,
        username : user,
        position : pos
      })
  
      usl.password = usl.generateHash(pass)
      const usr = await usl.save()

      return usr._id 
    } catch (e) {
      // console.log('\n')
      // console.log(e)
      // console.log(id, user, pass, pos)
      // console.log('\n')
      console.log('shit happened at User')
      // console.log(e)
      // process.exit()
      // return new Error(`User =====> ${ JSON.stringify(e) }`)
    }

    return null
  }

  const createBus = async data => {
    const { user, name, status, seats, luggage } = data

    try {
      const bus = await new Bus({
        id : meta.lastBusId++,
        user,
        name,
        status,
        active : false,
        // alias : name
      }).save()

      const busDetail = await new BusDetail({
        bus : bus._id,
        seatQty : seats,
        luggageQty : luggage,
      }).save()

      return bus._id
    } catch (e) {
      console.log('shit happened at Bus')
      // throw new Error(`Bus =====> ${ JSON.stringify(e) }`)
    }

    return null
  }

  const createAddress = async (state, city, street, zipcode) => {
    try {
      const address = await new Address({
        state,
        city,
        street,
        zipcode,
      }).save()
  
      return address._id
    } catch (e) {
      console.log('shit happened at Route')
      // throw new Error(`Route =====> ${ JSON.stringify(e) }`)
    }

    return null
  }

  const createRide = async data => {
    const { bus, to, frm, status, time, date, seatsOccupied, luggage } = data

    try {
      const willBus = genRand(2, 0, false) > 0.35
      const isPending = status === 'PENDING'
      const stat = willBus && isPending ? 'ASSIGNED' : status
      const bs = stat !== 'PENDING' ? bus : null

      const ride = await new Ride({
        id : meta.lastRideId++,
        bus : bs,
        to,
        frm,
        time,
        date,
        status : stat
      }).save()

      rideTimes.push({ time, date, to, frm })

      const details = await new RideDetail({
        ride : ride._id,
        seatsOccupied,
        luggage
      }).save()

      return ride._id
    } catch (e) {
      console.log('shit happened at Ride')
      throw new Error(`Ride =====> ${ JSON.stringify(e) }`)
    }
  }

  const createPackage = async person => {
    const info = packageInfo[ genRand(packageInfo.length) ]
    const { weight, message } = info

    try {
      const pack = await new Package({
        // id : meta.lastPackageId++,
        person,
        weight,
        message,
      }).save()

      return pack._id
    } catch (e) {
      throw new Error(`Package =====> ${ JSON.stringify(e) }`)
    }
  }

  const createReceipt = async data => {
    try {
      const receipt = await new Payment(data).save()

      return receipt._id
    } catch (e) {
      console.log(e)
      process.exit()
    }

    return null
  }

  const createTicket = async ticketData => {
    const {
      to,
      frm,
      person,
      ride,
      receipt,
      status,
      pick,
      drop,
      date,
      time,
      isLocal,
      isPackage,
      fee,
      extraFee
    } = ticketData

    let pack = null

    try {
      if(isPackage) pack = await createPackage(person)

      const details = await new TicketDetail({
        pickUpAddress : pick,
        dropOffAddress : drop,
        redeemedCount : 0,
        isLocal,
        fee,
        extraFee
      }).save()

      const ticket = await new Ticket({
        id : meta.lastTicketId++,
        person,
        date,
        time,
        ride,
        receipt,
        status,
        details : details._id,
        willPick : Boolean(pick),
        willDrop : Boolean(drop),
        frm,
        to,
        isPackage,
        package : pack,
      }).save()

      return ticket._id
    } catch (e) {
      console.log(e)
      throw new Error(`Ticket =====> ${ JSON.stringify(e) }`)
    }
  }
//#endregion

  // //////////////////////////

  const createSuperUser = async () => {
    try {
      const id = await createPerson('jenky', 'nolasco', 'j.nolasco@email.io', '1234567890')
      const id2 = await createPerson('randy', 'mejia', 'r.mejia@gmail.com', '1234567890')
      const drvr = createUser(id, 'nolasco', 'nolasco', 'DRIVER')
      const su = createUser(id, 'jenky', 'lllll', 'SUPERUSER')

      return Promise.all([drvr, su])
    } catch (e) {
      throw new Error(`SuperUser =====> ${ JSON.stringify(e) }`)
    }
  }

  const createPeople = async () => {
    console.log(`There are going to be ${ peopleLimit } people!`)

    const promises = []
    try {
      for(let i = 0; i < peopleLimit; i++) {
        const user = users[ genRand(users.length) ]

        const {
          firstname,
          lastname,
          email,
          phoneNumber
        } = user

        promises.push(createPerson(firstname, lastname, email, phoneNumber))
      }

      await Promise.all(promises)

      console.log('People created!!')
    } catch(e) {
      throw new Error(`Create People =====> ${ JSON.stringify(e) }`)
    }
  }

  const createUsers = async () => {
    const promises = []

    try {
      for(let i = 0; i < usersLimit; i++) {
        const rnd = genRand(positions.length)

        promises.push(Person
          .aggregate([{ $sample : { size : 1 }}])
          .then(([ person ]) => {
            driversLimit -= 1

            const pos = positions[ rnd ]
            const isDriver = driversLimit > 0

            return createUser(
                person._id,
                person.firstname,
                'lllll',
                isDriver ? 'DRIVER' : pos
              )
            }
          )
        )
      }

      const aggregate = await Promise.all(promises)

      // await Promise.all(aggregate)

      console.log('Users created!!')

    } catch (e) {
      throw new Error(`Create User =====> ${ JSON.stringify(e) }`)
    }
  }

  const createAddresses = async () => {
    console.log(`There are going to be ${ addressLimit } addresses!`)
    const promises = []

    try {
      for(let i = 0; i < addressLimit; i++) {
        const { street, city, state, zipcode } = addresses[ genRand(addLen) ]

        promises.push(createAddress(state, city, street, zipcode))
      }

      await Promise.all(promises)

      console.log('Routes created!!')
    } catch (e) {
      throw new Error(`Create Routes =====> ${ JSON.stringify(e) }`)
    }
  }

  const createRides = async () => {
    console.log(`There are going to be ${ rideLimit } rides!`)

    const promises = []

    try {
      for(let i = 0; i < rideLimit; i++) {
        const to = routes[ genRand(routes.length) ]
        const frm = routes[ genRand(routes.length) ]
        const status = rideStatus[ genRand(rideStatus.length) ]
        const time = times[ genRand(times.length) ]
        const date = getAnyDate()
        const seats = genRand(20)
        const luggage = genRand(10)

        promises.push(
          Bus
            .aggregate([{ $sample : { size : 1 }}, { $project : { _id : 1 }}])
            .then(([ bus ]) => createRide({
                bus : bus._id,
                to,
                frm,
                status,
                time,
                date,
                seatsOccupied : seats,
                luggage,
              })
            )
        )
      }

      await Promise.all(promises)

      console.log('Rides created!!!')
    } catch (e) {
      console.log(e)
      // process.exit()
    }

    return null
  }

  const createBusses = async () => {
    const promises = []
    try {
      const drivers = await User.find({ position : 'DRIVER' }, { _id : 1 })

      const bussesCount = busNames.length

      for(let i = 0; i < bussesCount; i++) {
        const status = busStatus[ genRand([ busStatus.length ]) ]
        const name = busNames[ i ]
        const seats = genRand(30,20)
        const luggage = genRand(50,30)

        promises.push(
          createBus({
            user : (drivers[ i ] ? drivers[ i ]._id : null),
            name,
            status,
            seats,
            luggage,
          })
        )
      }

      await Promise.all(promises)

      console.log('Busses created!!')
    } catch (e) {
      console.log(e)
    }

    return null
  }

  const createTickets = async () => {
    console.log(`There are going to be ${ ticketLimit } tickets!`)
    const projection = { $project : { _id : 1 }}
    const promises = []

    try {
      for(let i = 0; i < ticketLimit; i++) {
        const howManyTickets = genRand(4, 1)
        let howManyPackages = genRand(howManyTickets)

        const fee = 30
        const extraFee = howManyPackages * 15

        const totalAmount = (fee * howManyTickets) + extraFee

        promises.push(
          Person
            .aggregate([{ $sample : { size : 1 }}, projection ])
            .then(([ person ]) =>
              Promise.all([
                person,
                Ride.aggregate([{ $sample : { size : 1 }} ])
              ])
            )
            .then(([ person, [ ride ]]) => {
              const paymentType = payType[ genRand(payType.length) ]

              const isCard = paymentType === 'CARD'
              const cardBrand
                = isCard
                ? getRandCard()
                : ''
              const cardLastDigits
                = isCard
                ? `${ genRand(10000, 0) }`
                : ''
              const luggageQty = genRand(5)

              const receipt = createReceipt({
                id : meta.lastReceiptId++,
                paymentType,
                totalAmount,
                cardBrand,
                cardLastDigits,
                luggageQty,
                packagesQty : howManyPackages,
                ticketQty : howManyTickets,
              })

              return Promise.all([ person, ride, receipt ])
            })
            .then(async ([ person, ride, receipt ]) => {

              const status = ticktsStatus[ genRand(ticktsStatus.length) ]
              const assignedRide = genRand(2)
              const willPick = genRand(2)
              const willDrop = genRand(2)
              const howMany = genRand(7)

              let toState = null
              let frmState = null
              let time = null
              let date = null

              if(assignedRide) {
                toState = ride.to
                frmState = ride.frm
                time = ride.time
                date = ride.date

              } else {
                const rd = rideTimes[ genRand(rideTimes.length) ]

                toState = rd.to
                frmState = rd.frm
                time = rd.time
                date = rd.date
              }

              const [ pick ] = await (
                          willPick
                          ? Address.aggregate([{ $sample : { size : 1 }}, projection ])
                          : [ null ]
                        )
              const [ drop ] = await (
                          willDrop
                          ? Address.aggregate([{ $sample : { size : 1 }}, projection ])
                          : [ null ]
                        )

              const isLocal = genRand(2)

              const ticketsPromises = []

              for(let j = 0; j < howMany; j++) {
                const isPackage = howManyPackages-- > 0

                ticketsPromises.push(
                  createTicket({
                    to : toState,
                    frm : frmState,
                    person : person._id,
                    ride : assignedRide ? ride._id : null,
                    receipt,
                    status,
                    pick : pick !== null ? pick._id : null,
                    drop : drop !== null ? drop._id : null,
                    date,
                    time,
                    isLocal,
                    isPackage,
                    fee,
                    extraFee : isPackage ? 15 : 0
                  })
                )
              }
              
              return Promise.all(ticketsPromises)
            })
        )

        i += howManyTickets
      }

      const p = await Promise.all(promises)
      console.log(p.reduce((p, n) => p.concat(n), []))

      console.log('Tickets created!!')

      // process.exit()

      // return ticketLimit
    } catch (e) {
      console.log(e)
      console.log('shit happened')
      throw new Error(`Ticket =====> ${ JSON.stringify(e) }`)
    }
  }

  // /////////////////////////////////////////////////
  //        DANGER ZONE!!!!!
  // ////////////////////////////////////////////////
  const eraseContent = async () => {
    try{
      const a = await Person.remove({})//, () => {})
      const b = await User.remove({})//, () => {})
      const c = await Ride.remove({})//, () => {})
      const d = await RideDetail.remove({})
      const e = await Ticket.remove({})//, () => {})
      const f = await TicketDetail.remove({})
      const g = await Payment.remove({})
      const h = await Address.remove({})
      const i = await Bus.remove({})
      const j = await BusDetail.remove({})
      const k = await Meta.remove({})
      const l = await Package.remove({})

      // await Person.collection.dropIndexes()
      // await User.collection.dropIndexes()
      // await Ride.collection.dropIndexes()
      // await Ticket.collection.dropIndexes()
      // await TicketDetail.collection.dropIndexes()
      // await Payment.collection.dropIndexes()
      // await Route.collection.dropIndexes()
      // await Bus.collection.dropIndexes()
      // process.exit()

    } catch(e) {
      console.log(e)
      console.log('something happened....')
      
    }
  }
  // /////////////////////////////////////////////////

  (async () => {
    try {
      await eraseContent()

      await createSuperUser()
      await createPeople()
      await createUsers()
      await createAddresses()
      await createBusses()
      await createRides()
      await createTickets()

      await new Meta(meta).save()
      
      await mongoose.connection.close()

      console.log('')
      console.log('')
      console.log('Process done!')
      console.log('')
    } catch (e) {
      console.log(e, 'Something happened on data (models/mockupData.js)...') 
      process.exit()
    }
  })()
})