// Tempting to rename CRUD

import {
  Person,
  Address,
  Receipt,
  // Meta,
  // Bus,
  // BusDetail,
  // Payment,
  // Ride,
  // RideDetail,
  // Ticket,
  // TicketDetail,
  // User
} from '../models'

// TODO : Add how many times this person has bought tickets in the application for logging purposes
export const createPerson = async data => {
  const { firstname, lastname, email, phoneNumber } = data

  try {
    let person = await Person.findOne({ $or : [{ email }, { phoneNumber }] })

    if(!person) person = await new Person({ firstname, lastname, email, phoneNumber }).save()

    return person._id
  } catch (e) {
    console.log(e)
    console.log('.... @src/utils/index.js (Tempted to rename "CRUD")')
  }

  return null
}

export const createReceipt = async data => {
  const {
    paymentType = 'CASH',
    totalAmount,
    cardBrand = '',
    luggageQty = 0,
    cardLastDigits = '',
    ticketQty = 1,
    packageQty = 0,
    id
  } = data

  try {
    const receipt = await new Receipt({
      id,
      paymentType,
      totalAmount,
      cardBrand,
      cardLastDigits,
      ticketQty,
      luggageQty,
      packageQty
    }).save()

    return receipt._id
  } catch (e) {
    console.log(e)
    console.log('... @ src/routes/api/utils/index.js@createReceipt')
  }

  return null
}

// TODO : Add how many times this address has been used in the application for logging purposes
export const createAddress = async data => {
  const { street, state, zipcode, city } = data

  try {
    let address = await Address.findOne({ street, state, zipcode, city })

    if(!address) address = await new Address({ street, state, zipcode, city }).save()

    return address._id
  } catch (e) {
    console.log(e)
    console.log('... @ src/utils/index.js')
  }

  return null
}

// Remove non wanted fields
export const filterDoc = doc => {
  if(!doc) return null

  const { _id, __v, modifiedAt, createdAt, ...rest }  = doc

  return rest
}

export const filterAggregate = async (docs, filterFunc, sortOrder) => {
  const promises = docs.map(async ({ _id, body }) => {
    const { month, date, year } = _id
    const datekey = '' + year + ('0' + month).slice(-2) + ('0' + date).slice(-2)
    const id = `${ ('0' + month).slice(-2) }-${ ('0' + date).slice(-2) }-${ year }`

    const promiseResults = await Promise.all(body.map(filterFunc))

    const results = promiseResults.map(obj => ({ ...obj, addedAt : new Date() }))

    return { id, results, datekey }
  })

  const newDocs = await Promise.all(promises)
  const collator = new  Intl.Collator(undefined, { numeric : true, sensitivity : 'base' }) 

  const sortedDocuments = newDocs.sort((a,b) => collator.compare(a.datekey, b.datekey))

  //newDocs.sort((a, b) => sortOrder === 'asc' ? a.dateKey - b.dateKey : b.dateKey - a.dateKey)
  console.log(sortedDocuments)

  return sortedDocuments
}

// TODO : Make sure willPick and willDrop are sent as booleans
export const createTicketSideData = async data => {
  try {
    const person = await createPerson(data)
    const pickUpAddress = await (
      data.willPick
      ? createAddress({ ...data.pickUpAddress })
      : null)

    const dropOffAddress = await (
      data.willDrop
      ? createAddress({ ...data.dropOffAddress })
      : null)

    const receipt = await createReceipt(data)

    const retrnData = [ person, pickUpAddress, dropOffAddress, receipt ]

    return retrnData
  } catch (e) {
    console.log(e)
    console.log('... @ src/utils/index.js')
  }

  return null
}