import {
  updateRecordApiEndpoint,
  updateSongStatsApiEndpoint,
  getRecordsApiEndpoint,
  updateHostingStatsApiEndpoint
} from './_apiEndpoints'
import { credentials } from './_credentials';

export const pageLanguage = document.body.classList.contains('ru') ? 'ru' : 'en'

export const REINITIALIZE_APP_EVENT = 'reinitialize-app'

export const setPlayerTitle = title => {
  document.querySelector('#current-playlist').innerHTML = title
}

export const tariff = {
  stream: false
}

export const collectData = (playerInstance) => {
  const data = {
    baseId: playerInstance.playerState.baseId,
    tableId: playerInstance.playerState.playlist.currentPlaylistTableId,
    recordId: playerInstance.currentTrackId,
    currentIndex: playerInstance.currentTrackIndex,
    // first and second tracks of a playlist are without speed and time calculations, so use empty strings instead...
    downloadingSpeed: playerInstance.nextTrackDownloadSpeed ? playerInstance.nextTrackDownloadSpeed.toFixed(1) : '',
    downloadingTime: playerInstance.nextTrackDownloadTime ? playerInstance.nextTrackDownloadTime.toFixed(1) : '',

    playlistName: playerInstance.playerState.playlist.currentPlaylistTableName,
    timestamp: new Date().toLocaleString('ru-RU'),
  }

  return data
}

// https://stackoverflow.com/a/8511350/9675926
export const isObject = (x) => typeof x === 'object' && !Array.isArray(x) && x !== null

// https://www.freecodecamp.org/news/javascript-debounce-example/
export function debounce(func, timeout) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}





// fetch playlists from airtable
export const fetchPlaylist = async (baseId, tableId) => {
  const queryParams = { baseId, tableId }
  const searchParams = new URLSearchParams(queryParams)
  const urlToFetchRecords = `${getRecordsApiEndpoint}?${searchParams}`
  
  try {
    const response = await fetch(urlToFetchRecords)
    const playlist = await response.json()
    console.log('pl', playlist)
    return playlist
    
  } catch (error) {
    console.warn(`there was a network error, when loading ${tableId} playlist`)
    // console.warn(`"${playlistName}" not found`)
    console.log(error)
  }
}


// function for shuffling array
export function shuffle(array) {
  // THIS function only shuffles array


  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  // Shuffles array which commes as an argument
  return array;
}


// split all interval tracks into 10's
// then shuffle each 10
// then add extra shuffling for each 2nd track
export function randomize(array) {
  const chunks = [];
  const length = array.length;

  console.log('initial array of tracks', array)

  for (let i = 0; i < length; i += 10) {
    const chunk = array.slice(i, i + 10);
    // const randomized = shuffle(chunk)
    chunks.push(shuffle(chunk));
  }

  // [[1,2,3],[4,5,6]] -> [1,2,3,4,5,6]
  //
  const shuffledTracks = chunks.flat()

  const secondTracks = []
  for (let i = 1; i < length; i += 2) {
    secondTracks.push(shuffledTracks[i])
  }

  const randomizedSecondTracks = shuffle(secondTracks)
  let counter = 0
  for (let i = 1; i < length; i += 2) {
    const randomizedTrack = randomizedSecondTracks[counter]
    counter++
    shuffledTracks[i] = randomizedTrack
  }

  console.log(`shuffledTracks (at first shuffled by 10, then also randomized each 2nd)`, shuffledTracks)
  return shuffledTracks
}
// data = {
//   baseId: 'example baseId',
//   tableId: 'example tableId', // can be either actual id (e.g. 'tbls88896G6g') or just regular table name (.e.g. 'My awesome table')
//   recordId: 'example recordId',
//   tableId: 'exampla tableId',
//   newStatus: 'Like' // can be either 'Like' or 'Dislike'
// }
export const sendLikeDislike = async data => {
  
  try {
    
    const response = await send(updateRecordApiEndpoint, data)
    
    return response.json()
    
  } catch (error) {
    console.log(error)
  }
}


// data = {
//   baseId
//   : 'example baseId',
//   tableId: 'example tableId', // can be either actual id (e.g. 'tbls88896G6g') or just regular table name (.e.g. 'My awesome table')
//   recordId: 'example recordId',
//   tableId: 'exampla tableId',
//   skipped: true // optional paramater (if set, may be true or false)
// }
export const sendSongStats = async data => {
  
  try {
    
    const response = await send(updateSongStatsApiEndpoint, data)
    
    return response.text()
    
  } catch (error) {
    console.log(error)
  }
}

export const updateHostingStats = async ({playlistName}) => {
  const {login, password} = credentials

  try {

    const response = await send(updateHostingStatsApiEndpoint, {playlistName, login, password})

    return response.text()

  } catch (error) {
    console.error(error)
  }
}

function send(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
}
