import { handleLogin } from './handleLogin'
import { getRecordsApiEndpoint } from './_apiEndpoints'

const getBaseId = async () => {
  const baseId = await new Promise(resolve => {
    handleLogin(resolve)
  })

  return baseId
}


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
// ];

(async () => {
  const baseId = await getBaseId()
  const queryParams = { baseId, tableId: 'Info' }
  const searchParams = new URLSearchParams(queryParams)
  const urlToFetchRecords = `${getRecordsApiEndpoint}?${searchParams}`
  const response = await fetch(urlToFetchRecords)
  const records = await response.json()

  console.log(records)

  const playlists = document.querySelector('#playlists')

  playlists.innerHTML = ''
  records.forEach((record, i) => {
    const playlistName = record.fields['Name']
    const playlistDescription = record.fields['Notes']
    const selected = i === 0

    if (selected) {
      document.querySelector('#current-playlist').innerHTML = playlistName
    }

    const html = `
      <div class="playlist ${selected ? 'playlist--selected' : ''}" data-playlist-name="${playlistName}">
        <span class="playlist__name">
          <span>🎶</span> ${playlistName}
        </span>
        <span class="playlist__description">
          ${playlistDescription}
        </span>
      </div>
    `

    playlists.innerHTML += html
  })
  
  playlists.addEventListener('click', event => {
    
    if (event.target.closest('.playlist')) {
      const playlistEl = event.target.closest('.playlist');
      const playlistName = playlistEl.dataset.playlistName

      document.querySelector('.playlist--selected').classList.remove('playlist--selected')
      playlistEl.classList.add('playlist--selected')
      // playlists.prepend(playlistEl)
      document.querySelector('#current-playlist').innerHTML = playlistName
    }
  })
})()

