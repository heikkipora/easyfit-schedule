import {initServer} from './server'

const port = Number(process.env.PORT || '3000')

initServer(port)
  .then(() => console.log(`Server listening on port ${port}`))
  .catch(console.error)
