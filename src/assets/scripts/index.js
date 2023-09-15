import { handleLogin } from './_handleLogin'
import { getRecordsApiEndpoint } from './_apiEndpoints'
import { handlePlayer } from './_player'

const getBaseId = async () => {
  const baseId = await new Promise(resolve => {
    handleLogin(resolve)
  })
  
  return baseId
}

// const records = [
//   {
//     "id": "tbl886QoG6g0tC9tV",
//     "createdTime": "2023-04-27T10:22:27.000Z",
//     "fields": {
//       "Name": "Indie playlist",
//       "Status": "Active",
//       "Notes": "Главный плейлист. Инди настроечка, лайтовый, ласковый, без бороды и шашлывков. йо\nРасписание: — здесь должно быть описано, как играет плейлист в течении недели —"
//     }
//   },
//   {
//     "id": "tblyqMDwKvBNSJPOY",
//     "createdTime": "2023-06-20T18:04:28.000Z",
//     "fields": {
//       "Name": "test playlist #2",
//       "Status": "Active",
//       "Notes": "test playlist description"
//     }
//   },
// ];

(async () => {
  const baseId = await getBaseId()
  const queryParams = { baseId, tableId: 'Info' }
  const searchParams = new URLSearchParams(queryParams)
  const urlToFetchRecords = `${getRecordsApiEndpoint}?${searchParams}`
  const response = await fetch(urlToFetchRecords)
  const records = await response.json()
  
  console.log(records)
  
  
  // fetch playlists from airtable
  const fetchPlaylists = async (records) => {
    const promises = records.map(record => {
      const playlistName = record.fields['Name']
      const playlistDescription = record.fields['Notes']
      
      return new Promise(async (resolve, reject) => {
        const queryParams = { baseId, tableId: playlistName }
        const searchParams = new URLSearchParams(queryParams)
        const urlToFetchRecords = `${getRecordsApiEndpoint}?${searchParams}`
        
        try {
          const response = await fetch(urlToFetchRecords)
          const playlist = await response.json()
          
          resolve({ playlistName, playlist, playlistDescription })
        } catch (error) {
          console.warn(`"${playlistName}" not found`)
          console.log(error)
          reject('error')
        }
      })
    })
    
    const playlistsData = await Promise.allSettled(promises)
    const fulfilled = playlistsData.filter(playlist => playlist.status === 'fulfilled')
    const existingPlaylists = fulfilled.map(playlist => playlist.value)
    
    return existingPlaylists
  }
  
  const playlists = document.querySelector('#playlists')
  const existingPlaylists = await fetchPlaylists(records)
  
  const renderPlaylistsMarkup = () => {
    playlists.innerHTML = ''
    existingPlaylists.forEach((playlist, i) => {
      const { playlistName, playlistDescription } = playlist
      const selected = i === 0
      
      if (selected) {
        document.querySelector('#current-playlist').innerHTML = playlistName
      }
      
      const html = `
        <button class="playlist ${selected ? 'playlist--selected' : ''}" data-playlist-name="${playlistName}">
          <span class="playlist__name">
            <span class="note-sign">🎶</span> ${playlistName}
          </span>
          <span class="playlist__description">
            ${playlistDescription}
          </span>
        </button>
      `
      
      playlists.innerHTML += html
    })
  }
  
  renderPlaylistsMarkup();
  
  playlists.addEventListener('click', event => {
    
    if (event.target.closest('.playlist')) {
      const playlistEl = event.target.closest('.playlist');
      const playlistName = playlistEl.dataset.playlistName
      
      document.querySelector('.playlist--selected').classList.remove('playlist--selected')
      playlistEl.classList.add('playlist--selected')
      
      document.querySelector('#current-playlist').innerHTML = playlistName
    }
  })
  
  handlePlayer(existingPlaylists, baseId)
})()

