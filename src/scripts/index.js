import { handleLogin } from './utils/_handleLogin'
import { getRecordsApiEndpoint } from './utils/_apiEndpoints'
import { Player } from './_player'
import { REINITIALIZE_APP_EVENT, setPlayerTitle } from './utils/_helpers';


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

// (async () => {
//   await initialize()
//
//   window.addEventListener('reinitialize-app', () => initialize())
// })()

const initialize = async () => {
  const baseId = await getBaseId()
  const queryParams = { baseId, tableId: 'Info' }
  const searchParams = new URLSearchParams(queryParams)
  const urlToFetchRecords = `${getRecordsApiEndpoint}?${searchParams}`
  const response = await fetch(urlToFetchRecords)
  const playlistsInfo = await response.json()

  console.log('playlistsInfo', playlistsInfo)

  const playlists = document.querySelector('#playlists')

  const renderPlaylistsMarkup = () => {
    playlists.innerHTML = ''
    playlistsInfo.forEach((playlist, i) => {
      const playlistName = playlist.fields['Name']
      const playlistDescription = playlist.fields['Notes']
      const selected = i === 0

      if (selected) {
        // document.querySelector('#current-playlist').innerHTML = playlistName
        setPlayerTitle(playlistName)
      }

      const html = `
        <button disabled class="playlist ${selected ? 'playlist--selected' : ''}" data-playlist-name="${playlistName}">
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


  console.log('ap', playlistsInfo)
  const availablePlaylists = playlistsInfo.map(playlist => {
    const playlistName = playlist.fields['Name']
    const tableId = playlist.tableId

    return {
      playlistName,
      tableId
    }
  })


  const player = new Player()

  await player.initializePlayer(availablePlaylists, baseId);

}


(async () => {
  await initialize()

  // window.addEventListener('reinitialize-app', async () => await initialize())
  window.addEventListener(REINITIALIZE_APP_EVENT, async () => {
    // maybe prepare some additional data to use in next player initialization iteration
    // ...
    console.warn('the player is attempting to reinitialize')
    // alert(5)

    setPlayerTitle('the player is attempting to update..')
    await initialize()
    // it's not needed
    // playerState.playlistEnded = false // as it is reinitialized
  })
})()
