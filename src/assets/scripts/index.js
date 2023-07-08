import { handleLogin } from './handleLogin'

const getBaseId = async () => {
  const baseId = await new Promise(resolve => {
    handleLogin(resolve)
  })
  
  return baseId
}

(async () => {
  const baseId = await getBaseId()
})()
