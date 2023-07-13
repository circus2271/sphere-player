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

  const playlistTemplate = document.querySelector('#playlist-template')
  const playlists = document.querySelector('#playlists')

  records.forEach(record => {
    const playlistName = record.fields['Name']

    playlists.textContent = ''
    records.forEach((record, i) => {
      const playlistName = record.fields['Name']
      const clone = playlistTemplate.content.cloneNode(true)
    
      clone.querySelector('.playlist span').textContent = playlistName
    
      if (i === 0) {
        clone.querySelector('.playlist').classList.add('playlist--selected')
        document.querySelector('#current-playlist').textContent = playlistName
      }
    
      playlists.appendChild(clone)
    })
  })
})()
// const records = [
//   {
//     "id": "recD9LVoSJl9K48Q7",
//     "createdTime": "2023-04-27T10:22:27.000Z",
//     "fields": {
//       "Name": "Indie playlist",
//       "Status": "Active",
//       "Notes": "Главный плейлист. Инди настроечка, лайтовый, ласковый, без бороды и шашлывков. йо\nРасписание: — здесь должно быть описано, как играет плейлист в течении недели —"
//     }
//   },
//   {
//     "id": "recZT73zeu4bXjvHK",
//     "createdTime": "2023-06-20T18:04:28.000Z",
//     "fields": {
//       "Name": "test playlist #2",
//       "Status": "Active",
//       "Notes": "test playlist description"
//     }
//   }
// ]


// console.log(playlistTemplate.content.cloneNode(true))
// console.log(playlistTemplate.content.cloneNode(true))
// document.querySelector('.place').appendChild(playlistTemplate.content)
// document.querySelector('.current-playlist').appendChild(playlistTemplate.content)
