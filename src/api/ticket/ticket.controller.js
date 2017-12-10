import { Ticket, Receipt, TicketDetail, Person, Meta, Address /*,Bus*/ } from '../../models'
import { createPerson, createAddress, filterDoc /*, formatDate, formatHour, formatPhone*/ } from '../../utils'

// ///////////////// Helper functions
export const getTicketData = async tckt => {
  try {
    const person = await Person.findById(tckt.person)
    const details = await TicketDetail.findById(tckt.details)
    const recpt = await Receipt.findById(tckt.receipt)
    const pick = await (tckt.willPick ? Address.findById(details.pickUpAddress) : 'none')
    const drop = await (tckt.willDrop ? Address.findById(details.dropOffAddress) : 'none')

    const pickAdd = pick !== 'none' && pick ? { ...pick.toObject() } : pick
    const dropAdd = drop !== 'none' && drop ? { ...drop.toObject() } : drop

    const { _id, createdAt, __v, luggage, ...receipt } = recpt._doc

    const data = {
      id : tckt.id,
      _id : tckt._id,
      willDrop : tckt.willDrop,
      willPick : tckt.willPick,
      luggage,
      status : tckt.status,
      from : tckt.from,
      to : tckt.to,
      pickUpAddress : filterDoc(pickAdd),
      dropOffAddress : filterDoc(dropAdd),
      time : tckt.time,
      // date : new Date(tckt.date).setHours(0,0,0,0).toISOString(),
      date : tckt.date,
      person : {
        firstname : person.firstname,
        lastname : person.lastname,
        email : person.email,
        phoneNumber : person.phoneNumber
      },
      redeemedCount : details.redeemedCount,
      receipt : { ...receipt }
    }

    return data//.filter(Boolean)
  } catch (e) {
    console.log(e)
    console.log('ticket.controller.js')
  }

  return null
}

export const getTicketReceipt = async tckt => {
  try {
    const receipt = await Receipt.findById(tckt.receipt)
    const { cardLastDigits, cardBrand, totalAmount, type, fee, extraFee } = receipt

    const data = { fee, extraFee, totalAmount, type }

    if(type === 'CARD')

    data.cardBrand = cardBrand
    data.cardLastDigits = cardLastDigits

    return data
  } catch (e) {
    console.log(e)
    console.log('ticket.controller.js')
  }

  return null
}

// Middleware for webhook data
export const reformatTicket = (ctx, next) => {
  const { body } = ctx.request

  // If its local, return. No need to reformat data structure
  // console.log(body)
  if(body.isLocal) return next()

  // This is for the page data
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
  }

  ctx.request.body = newBody

  return next()
}

// Ticket details
export const saveTicket = async ticketInfo => {
  const { 
    id,
    data,
    receipt,
    person,
    pickUp,
    dropOff
  } = ticketInfo

  const {
    frm,
    to,
    // luggage,
    willPick,
    willDrop,
    status = 'NEW',
    departureDate,
    departureTime,
  } = data

  let details = null
  let tckt = null

  try {
    details = await new TicketDetail({ 
      pickUpAddress : pickUp,
      dropOffAddress : dropOff,
      redeemedCount : 0,
    }).save()

    // TODO: Make sure that the data inserted is sanitized, or it'll break!!!
    tckt = await new Ticket({
      id,
      person,
      details : details._id,
      receipt,
      status,
      // luggage,
      willPick,
      willDrop,
      from : frm,
      to,
      // date : (new Date(departureDate)).setHours(0,0,0,0).toISOString(),
      date : departureDate,
      time : departureTime,
    }).save()

    return tckt._id
  } catch(e) {
    [ 
      { obj : tckt, coll : Ticket },
      { obj : receipt, coll : Receipt },
      { obj : details, coll : TicketDetail },
    ].forEach( item => {
      if(item.obj) item.coll.remove({ _id : item.obj._id })
    })
    console.log(e)
    return null
  }
}

const saveReceipt = async (id, howMany, data) => {
  const { cardBrand, cardLastDigits, totalAmount, paymentType, fee, extraFee, luggage } = data
  try {
    const receipt = await new Receipt({
      id,
      cardBrand,
      cardLastDigits,
      totalAmount,
      paymentType,
      fee,
      extraFee,
      luggage,
      ticketCount : howMany
    }).save()

    return receipt._id
  } catch (e) {
    console.log(e)
  }

  return null
}

// Create Tickets
export const saveTickets = async data => {
  const { howMany } = data

  const promises = []

  try {
    const meta = await Meta.findOne({})

    const person = await createPerson(data)

    const pickUp = await (
      data.willPick
      ? createAddress({ ...data.pickUpAddress })
      : null
    )

    const dropOff = await (
      data.willDrop
      ? createAddress({ ...data.dropOffAddress })
      : null
    )

    const receiptId = meta.lastReceiptId
    const receipt = await saveReceipt(receiptId, howMany, data)

    // If anything got bad on inserting, then erase all the shit back!
    if(!receipt || !person || (!pickUp && data.willPick) || (!dropOff && data.willDrop)) {
      console.log('Erasing shit... Something happened...')

      [
        // { obj : details, col : TicketDetail },
        { obj : person, col : Person }, 
        { obj : receipt, col : Receipt },
        { obj : pickUp, col : Address },
        { obj : dropOff, col : Address }
      ].forEach(async itm => {
        // Remove entries if any
        if(itm.obj) await itm.col.remove({ _id : itm.obj._id ? itm.obj._id : itm.obj })
      })

      return null
    }

    for(let i = 0; i < howMany; i++) 
      promises.push(saveTicket({
        id : meta.lastTicketId + i + 1,
        data,
        receipt,
        person,
        pickUp,
        dropOff
      }))

    const tickets = await Promise.all(promises)

    meta.lastReceiptId += 1
    meta.lastTicketId += tickets.length
    await meta.save()

    // return tickets
    return receiptId
  } catch (e) {
    console.log(e)
    return null
  }
}

export const updateTicket = async (id, data) => {
  /**
   * isLocal: true,
  frm: 'NY',
  to: 'PA',
  departureDate: '2020-09-25T04:00:00.000Z',
  departureTime: 4,
  howMany: 1,
  luggage: 0,
  firstname: 'Damian',
  lastname: 'Benjamin',
  phoneNumber: '9654725166',
  email: 'imperdiet.nec@lectussitamet.net',
  willPick: true,
  willDrop: false,
  pickUpAddress:
   { street: 'P.O. Box 258, 4084 Maecenas Road',
     city: 'Pike Creek',
     state: 'Delaware',
     zipcode: 13660 },
  dropOffAddress: null,
  totalAmount: 30,
  cardBrand: '',
  cardLastDigits: '',
  paymentType: 'CASH',
  status: 'NEW',
  fee: 30,
  extraFee: 0 } 866
   */
  // const {
  //   frm,
  //   to,
  //   departureTime,
  //   departureDate,
  //   willPick,
  //   willDrop,

  // } = data

  // try {
    
  // } catch (e) {
  //   console.log(e)
  // }
  return null
}
//////////////////////////////////////