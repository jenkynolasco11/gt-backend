import { Ticket, Receipt, TicketDetail, Person, Meta, Address, Package } from '../../../models'
import { filterDoc, createTicketSideData } from '../../../utils'

// ///////////////// Helper functions
const eraseData = async objects => {
  const { ticket, ticketDetail, receipt, pickUp, dropOff, pack } = objects

  // console.log(` Objects to delete => ` + JSON.stringify(objects, null, 2))

  try {
    if(ticketDetail) await TicketDetail.findByIdAndRemove(ticketDetail)
    if(receipt) await Receipt.findByIdAndRemove(receipt)
    if(dropOff) await Address.findByIdAndRemove(dropOff)
    if(ticket) await Ticket.findByIdAndRemove(ticket)
    if(pickUp) await Address.findByIdAndRemove(pickUp)
    if(pack) await Package.findByIdAndRemove(pack)
  } catch (e) { }
}

// Middleware for webhook data
export const reformatTicket = (ctx, next) => {
  const { body } = ctx.request

  // If its local, return. No need to reformat data structure
  if(body.isLocal) return next()
  
  /*
  const newBody = {
    frm : body.desde,
    to : body.hacia,
    departureDate : new Date(body.fecha_salida),
    departureTime : parseInt(body.hora_salida) - 1,
    howMany : body.numero_tickets,
    luggage : parseInt(body.extra_maletas),
    firstname : body.nombre.split(' ')[ 0 ],
    lastname : body.apellido.split(' ')[ 0 ],
    phoneNumber : body.telefono.replace(/\D/g, ''),
    email : body.email,
    willPick : body.recoger === 'checked',
    willDrop : body.dejar === 'checked',
    pickUpAddress : body.recoger === 'checked'
    ? {
      street : body.calle_origen,
      city : body.ciudad_origen,
      state : body.estado_origen,
      zipcode : body.zipcode_origen
    } 
    : null,
    dropOffAddress : body.dejar === 'checked'
    ? {
      street : body.calle_destino,
      city : body.ciudad_destino,
      state : body.estado_destino,
      zipcode : body.zipcode_destino
    }
    : null,
    totalAmount : parseFloat(body.total_final),
    cardBrand : body.card_brand.toUpperCase(),
    cardLastDigits : body.card_last_digits,
    paymentType : body.type ? body.type : 'CARD',
    status : 'NEW',
    fee : parseFloat(body.precio_primera_ruta),
    extraFee : parseFloat(body.precio_segunda_ruta),
    isLocal : false,
  }

  ctx.request.body = newBody
  */
  return next()
}

export const getTicketData = async tckt => {
  try {
    // let pack = null
    const person = await Person.findById(tckt.person)
    const pack = await Package.findById(tckt.package)
    const rcpt = await Receipt.findById(tckt.receipt)
    const details = await TicketDetail.findById(tckt.details)

    const pick = await (tckt.willPick ? Address.findById(details.pickUpAddress) : '')
    const drop = await (tckt.willDrop ? Address.findById(details.dropOffAddress) : '')

    const pickAdd = pick ? filterDoc(pick._doc) : 'none'
    const dropAdd = drop ? filterDoc(drop._doc) : 'none'
    const pkg = tckt.isPackage ? filterDoc(pack._doc) : null

    const isAssigned = tckt.ride !== null

    const data = {
      id : tckt.id,
      willDrop : tckt.willDrop,
      willPick : tckt.willPick,
      receipt : rcpt.id,
      status : tckt.status,
      frm : tckt.frm,
      to : tckt.to,
      pickUpAddress : pickAdd,
      dropOffAddress : dropAdd,
      time : tckt.time,
      date : tckt.date,
      person : {
        firstname : person.firstname,
        lastname : person.lastname,
        email : person.email,
        phoneNumber : person.phoneNumber
      },
      isPackage : tckt.isPackage,
      pkg,
      isAssigned,
    }

    // console.log(data)

    return data
  } catch (e) {
    console.log(e)
    console.log('... @ src/routes/api/ticket/ticket.controller.js')
  }

  return null
}

// Ticket details
/* export*/ const saveTicket = async body => {
  const {
    id,
    data,
    person,
    pickUpAddress,
    dropOffAddress,
    receipt,
  } = body

  const {
    frm,
    to,
    willPick,
    willDrop,
    status = 'NEW',
    date,
    time,
    isPackage = false,
    packageInfo = null
  } = data

  let details = null
  let tckt = null
  let pck = null

  try {
    const ddate = new Date(new Date(date).setHours(0,0,0,0))
    const ttime = Number(time)

    if(isPackage) pck = await new Package({ ...packageInfo }).save()

    details = await new TicketDetail({ 
      ...data,
      pickUpAddress,
      dropOffAddress,
      redeemedCount : 0
    }).save()

    console.log('ticket ID => ' + id)
    // TODO: Make sure that the data inserted is sanitized, or it'll break!!!
    tckt = await new Ticket({
      id,
      person,
      details : details._id,
      receipt,
      package : isPackage ? pck._id : null,
      status,
      willPick,
      willDrop,
      frm,
      to,
      date : ddate,
      time : ttime,
      isPackage
    }).save()

    if(!details || !tckt) throw new Error('Error while inserting data on tickets!')

    return tckt.id
  } catch(e) {
    // console.log(details, tckt, pck)
    // Oh snap! Some shit happened... rolling back.... again...
    await eraseData({ ticketDetails : details ? details._id : null, ticket : tckt ? tckt._id : null, pack : pck ? pck._id : null })

    // console.log(e)
    console.log('... @ src/routes/api/ticket/ticket.controller.js')
  }

  // Tempted to throw an error in here to roll back everything!
  return null
}

// Create Tickets
export const saveTickets = async data => {
  const promises = []
  let meta = null
  let person = null
  let pickUpAddress = null
  let dropOffAddress = null
  let receipt = null

  try {
    const { willPick, willDrop, ticketQty } = data

    meta = await Meta.findOne({})

    const [ prsn, pckup, drpff, rcpt ] = await createTicketSideData({
      ...data,
      id : meta.lastReceiptId++
    })

    person = prsn
    pickUpAddress = pckup
    dropOffAddress = drpff
    receipt = rcpt

    if(!person
      || (willDrop && !dropOffAddress) 
      || (willPick && !pickUpAddress) 
      || !receipt)
      throw new Error('Shit happened... Rolling back everything!')

    for(let i = 0; i < ticketQty; i++)
      promises.push(saveTicket({
        id : meta.lastTicketId++,
        data,
        receipt,
        person,
        pickUpAddress,
        dropOffAddress,
      }))

    const tickets = await Promise.all(promises)

    await meta.save()

    // return either tickets or receipt number
    return tickets
  } catch (e) {
    // Some shit happened... Roll back everything!!!
    await eraseData({ pickUpAddress, dropOffAddress, receipt })

    // console.log(e)
    console.log('... @ src/routes/api/ticket/ticket.controller.js')
  }

  // This means that something happened
  return null
}

export const updateTicket = async (id, data) => {
  try {
    const tckt = await Ticket.findOneAndUpdate({ id }, data, { new : true })

    if(tckt) {
      const details = await TicketDetail.findByIdAndUpdate(tckt.details, data, { new : true })

      if(details) return Number(id)
    }
  } catch (e) {
    console.log(e)
  }

  return null
}

export const getTicketReceipt = async id => {
  try {
    const tckt = await Ticket.findOne({ id })

    const tickets = (await Ticket.find({ receipt : tckt.receipt }, { id : 1, _id : 0 }))
                                        .map(i => i.id)
                                        .sort((a,b) => a - b)

    if(tckt) {
      const receipt = await Receipt.findById(tckt.receipt)
      const { cardLastDigits, cardBrand, totalAmount, paymentType, luggageQty, packageQty, ticketQty } = receipt

      const data = { totalAmount, paymentType, tickets, luggageQty, packageQty, ticketQty }

      if(paymentType === 'CARD') {
        data.cardBrand = cardBrand
        data.cardLastDigits = cardLastDigits
      }

      return data
    }
  } catch (e) {
    console.log(e)
  }

  return null
}

// ////////////////////////////////////
