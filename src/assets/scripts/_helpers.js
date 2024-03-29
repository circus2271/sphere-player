import { updateRecordApiEndpoint, updateSongStatsApiEndpoint, getRecordsApiEndpoint } from './_apiEndpoints'

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

// function splitArrayIntoTens(array) {
//   const result = [];
//   const length = array.length;
//
//   for (let i = 0; i < length; i += 10) {
//     const chunk = array.slice(i, i + 10);
//     result.push(chunk);
//   }
//
//   return result;
// }
// Example usage:
// const originalArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
// const splitArrays = splitArrayIntoTens(originalArray);
// console.log(splitArrays);


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
    
    const response = await fetch(updateRecordApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    
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
    
    const response = await fetch(updateSongStatsApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    
    return response.text()
    
  } catch (error) {
    console.log(error)
  }
}

// not old, but probably not needed
export const getCurrentTableId = (playlistsInfo) => {
  const currentSelectedPlaylistButton = document.querySelector('.playlist--selected')
  const currentPlaylistName = currentSelectedPlaylistButton.dataset.playlistName
  const currentPlaylist = playlistsInfo.find(playlist => playlist.playlistName === currentPlaylistName)
  const currentPlaylistTableId = currentPlaylist.tableId
  
  // debugger
  return currentPlaylistTableId
}







// old from here and below

// sendLikeDislike & updateSongStats
// usage example
// (async () => {
//   const dataExample = {
//     baseId: 'example base id',
//     // tableId may contain actual id or just a playlistname
//     // → tableId: 'tblhkaJOe'
//     // → tableId: 'Second test playlist'
//     tableId: 'example playlist name',
//     recordId: 'example id',
//     newStatus: 'Like' // or 'Dislike'
//   }
//
//   const data = {
//     baseId: 'fake_app62dBMf9YymV',
//     tableId: 'Second test playlist',
//     recordId: 'recJNCFEtgQ0ESpyg',
//   }
//
//   const response = await updateSongStats(data)
//   console.log('j', response)
// })()

// export function shuffle(array) {
//   var currentIndex = array.length, temporaryValue, randomIndex;
//
//   // While there remain elements to shuffle...
//   while (0 !== currentIndex) {
//
//     // Pick a remaining element...
//     randomIndex = Math.floor(Math.random() * currentIndex);
//     currentIndex -= 1;
//
//     // And swap it with the current element.
//     temporaryValue = array[currentIndex];
//     array[currentIndex] = array[randomIndex];
//     array[randomIndex] = temporaryValue;
//   }
//
//   return array;
// }

// export function animateHowlerPlayButton() {
//   document.querySelector("#howler-play").style.transition = 'visibility, opacity 0.25s ease-in'
//   document.querySelector("#howler-play").style.visibility = 'visible'
//   document.querySelector("#howler-play").style.opacity = 1
// }
//
// export function seekPlayingSongToAnEnd(secondsBeforeEnd = 10) {
//   // secondsBeforeEnd is an overridable default value
//   if (!sound1 && !sound2) {
//     console.warn('для перемотки трэка нужно сначала включить плеер')
//     return
//   }
//   if ((sound1 && !sound1.playing()) && (sound2 && !sound2.playing())) {
//     console.warn('перемотка работает только во время воспроизведения трэка')
//     return
//   }
//   if (sound1 && sound1.playing()) {
//     sound1.seek(sound1.duration() - secondsBeforeEnd)
//     console.log(`sound1 перемотана, до следующей песни осталось ${secondsBeforeEnd} секунд`)
//   }
//   if (sound2 && sound2.playing()) {
//     sound2.seek(sound2.duration() - secondsBeforeEnd)
//     console.log(`sound2 перемотана, до следующей песни осталось ${secondsBeforeEnd} секунд`)
//   }
// }
//
// export function addLikeDislikeClickHandlers() {
//   $("#submitLike").on("click", function (e) {
//
//     if (sound1 == undefined || sound2 === undefined) {
//       console.error('Error! Start player to enable likes');
//       return;
//     }
//
//     scheduleLikeOnSongEnd()
//   });
//
//   $("#submitDislike").on("click", function (e) {
//
//     if (sound1 == undefined || sound2 === undefined) {
//       console.error('Error! Start player to enable dislikes');
//       return;
//     }
//
//     scheduleDislikeOnSongEnd()
//   });
// }

// console.log('helpers')

// ================
// function insertingLikeDislikeFormDataFunctionExample() {
//
//   if (playingList == list1) {
//     $("input[name=playlistname]").val("Day list");
//   } else {
//     $("input[name=playlistname]").val("Weekend playlist");
//   }
//
//   if (sound1.playing() && !sound2.playing()) {
//     //console.log(sound1._src.split("musicLibrary/")[1]);
//     var song1name = sound1._src.split("https://570427.selcdn.ru/Sphere/musiclibrary/")[1];
//     $("input[name=songname]").val(song1name);
//   } else if (!sound1.playing() && sound2.playing()) {
//     //console.log(sound2._src.split("musicLibrary/")[1]);
//     var song2name = sound2._src.split("https://570427.selcdn.ru/Sphere/musiclibrary/")[1];
//     $("input[name=songname]").val(song2name);
//   } else {
//     $("input[name=songname]").val("?error?");
//   }
// }
//
// export let likeDislikeState = {
//   shouldLike: false,
//   shouldDislike: false,
//   requestData: {}
// }
//
// export function scheduleLikeOnSongEnd() {
//   likeDislikeState = {
//     shouldLike: true,
//     shouldDislike: false,
//   }
//
//   likeDislikeState.requestData = getRequestData()
// }
//
// export function scheduleDislikeOnSongEnd() {
//   likeDislikeState = {
//     shouldLike: false,
//     shouldDislike: true,
//   }
//
//   likeDislikeState.requestData = getRequestData()
// }
//
// export function resetLikeDislikeState() {
//   likeDislikeState = {
//     shouldLike: false,
//     shouldDislike: false,
//     requestData: {}
//   }
// }
//
// export function getRequestData() {
//   insertingLikeDislikeFormData();
//
//   let formData;
//   if (likeDislikeState.shouldLike === true) formData = $formLike.serializeObject();
//   if (likeDislikeState.shouldDislike === true) formData = $formDislike.serializeObject();
//   // reset like dislike app state
//
//   const requestData = {
//     ...formData,
//     login: formData.place,
//     password: localStorage.getItem('password'),
//     projectFolderName, // should be defined in a playRules script
//     placeFolderName, // should be defined in a playRules script
//     playlistFileName: playlists[formData.playlistname], // "playlists" should be defined in a playRules script
//     'client timestamp': new Date().toLocaleString("ru-RU")
//   }
//
//   return requestData
// }
//
// export function sendLikeDislikeIfScheduled() {
//   if (likeDislikeState.shouldLike || likeDislikeState.shouldDislike) {
//     sendLikeDislikeToServer()
//   }
// }
//
// export function sendLikeDislikeToServer() {
//
//   const requestData = likeDislikeState.requestData
//   resetLikeDislikeState()
//
//   if (playingList && requestData.value === 'dislike') {
//     const dislikedSongName = requestData.songname
//
//     playingList = playingList.filter(songURL => {
//       // extract songName from song url (get part of the url, that goes after last slash)
//       const songName = songURL.replace(/.*[/]/ig, '');
//
//       return songName !== dislikedSongName
//     })
//   }
//
//   var jqxhr = $.ajax({
//     url: serverlessFunctionUrl,
//     method: "POST",
//     contentType: 'text/plain',
//     // data: JSON.stringify($formLike.serializeObject()),
//     data: JSON.stringify(requestData),
//     success: console.log("value sended")
//   })
//     .done(function (res) {
//       if (res.result === 'success') console.log(res.message);
//       if (res.result === 'error') console.error(res.message);
//     });
// }

