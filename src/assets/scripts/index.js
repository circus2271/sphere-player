import { handleLogin } from './handleLogin'
import { getRecordsApiEndpoint } from './_apiEndpoints'

const getBaseId = async () => {
  const baseId = await new Promise(resolve => {
    handleLogin(resolve)
  })
  
  return baseId
}

(async () => {
  const baseId = await getBaseId()
  const queryParams = { baseId, tableId: 'Info'}
  const searchParams = new URLSearchParams(queryParams)
  const urlToFetchRecords = `${getRecordsApiEndpoint}?${searchParams}`
  const response = await fetch(urlToFetchRecords)
  const records = await response.json()
  
  console.log(records)
  records.forEach(record => {
    const playlistName = record.fields['Name']
    alert(playlistName)
  })
})()
