const user = 'database'
const pass = 'database'
const session = 'key for my session'  // generate this differently

export const PORT = 8000
export const DBURI = `mongodb://${ user }:${ pass }@ds137826.mlab.com:37826/gerardostrans`
export const KEY = 'THIS IS MY KEY'
export const SESSIONID = session
export const KEYS = ['asdbkjqnwe', 'akhdasjdkajhkasjdn']
export const ALLOWER_USERS = [ 'SUPERUSER', /*'DISPATCHER', 'MANAGER', */ ]

export default {
  PORT,
  DBURI,
  KEY,
  SESSIONID,
  KEYS,
  ALLOWER_USERS
}
