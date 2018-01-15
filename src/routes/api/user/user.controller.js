import { User, Person } from '../../../models'

export const createPerson = async data => {
  try {
    const { firstname, lastname, email, phoneNumber } = data

    const prsn = await Person.findOne({ $or : [{ email }, { phoneNumber }] })

    if(prsn) return prsn._id

    const person = await new Person({ firstname, lastname, email, phoneNumber }).save()

    if(person) return person._id
  } catch (e) {
    console.log(e)
  }

  return null
}

export const getUserData = async user => {
  try {
    const { username, person, position, status } = user
    const prsn = await Person.findById(person)

    if(person) {
      const { firstname, lastname, phoneNumber, email } = prsn

      const usr = {
        username,
        position,
        status,
        person : {
          firstname,
          lastname,
          phoneNumber,
          email,
        }
      }

      return usr
    }
  } catch (e) {
    console.log(e)
  }

  return null
}

export const createUser = async data => {
  try {
    const {
      username,
      password,
      position = 'NONE',
      status = 'ACTIVE',
    } = data

    const person = await createPerson(data)

    if(person) {
      const user = new User({ username, position, person, status })
      const pass = user.generateHash(password)
      user.password = pass

      const usr = await user.save()

      if(usr) return username
    }
  } catch (e) {
    console.log(e)
  }

  return null
}

export const updateUser = async (usr, body) => {
  try {
    const { _id, __v, createdAt, lastSession, modifiedAt, username, ...user } = usr.toObject()

    const data = await User.findOneAndUpdate({ username }, { ...user, ...body }, { new : true })

    if(modifiedAt !== data.modifiedAt) return await getUserData(data)
  } catch (e) {
    console.log(e)
  }

  return null
}