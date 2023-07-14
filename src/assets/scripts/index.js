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
  const queryParams = { baseId, tableId: 'Info' }
  const searchParams = new URLSearchParams(queryParams)
  const urlToFetchRecords = `${getRecordsApiEndpoint}?${searchParams}`
  const response = await fetch(urlToFetchRecords)
  const records = await response.json()
  
  console.log(records)
  
  const playlists = document.querySelector('#playlists')
  
  playlists.textContent = ''
  records.forEach((record, i) => {
    const playlistName = record.fields['Name']
    const playlistDescription = record.fields['Notes']
    const selected = i === 0
    
    if (selected) {
      document.querySelector('#current-playlist').innerHTML = playlistName
    }
    
    const html = `
      <button class="playlist ${selected ? 'playlist--selected' : ''}">
        <span class="playlist__name">
          ${playlistName}
        </span>
        <span class="playlist__description">
          ${playlistDescription}
        </span>
      </button>
    `

    playlists.innerHTML += html
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
