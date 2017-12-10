import Router from 'koa-router'

// import { Ticket, Payment, TicketDetail, Person, Ride, Route, Bus } from '../../models'

const route = new Router({ prefix : 'route' })

// const getTicketData = async tckt => {
//   try {
//     const ride = await Ride.findById(tckt.ride)
//     const person = await Person.findById(tckt.person)
//     const details = await TicketDetail.findById(tckt.details)
//     const frm = await Route.findById(ride.routeFrom)
//     const to = await Route.findById(ride.routeTo)

//     const data = {
//       willDrop : tckt.willDrop,
//       willPick : tckt.willPick,
//       pickUpAddress : details.pickUpPlace ? details.pickUpPlace : '',
//       dropOffAddress : details.dropOffPlace ? details.dropOffPlace : '',
//       luggage : tckt.luggageCount,
//       status : tckt.status,
//       routeFrom : {
//         state : frm.state,
//         city : frm.city,
//         street : frm.street,
//         zip : frm.zipcode,
//       },
//       routeTo : {
//         state : to.state,
//         city : to.city,
//         street : to.street,
//         zip : to.zipcode,
//       },
//       time : ride.time,
//       date : ride.date,
//       person : {
//         firstname : person.firstname,
//         lastname : person.lastname,
//         email : person.email,
//         phoneNumber : person.phoneNumber
//       }
//     }

//     return data
//   } catch (e) {
//     console.log(e)
//   }

//   return null
// }


export default route