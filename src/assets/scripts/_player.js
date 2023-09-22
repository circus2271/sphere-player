import howler from 'howler'
import { sendLikeDislike, updateSongStats, fetchPlaylist, getCurrentTableId, shuffle } from './_helpers.js'
import { PlayerState } from './_playerState'

let currentPlaylist, currentPlaylistTableId;
let baseIdData;


const audioPlayer = document.getElementById('audioPlayer');




const playerState = new PlayerState()


export const handlePlayer = async (playlistsInfo, baseId) => {
  baseIdData = baseId;
  console.log('hello from player')
  
  console.log('pip', playlistsInfo)
  // const firstAndActivePlaylist = playlistsInfo[0]
  const firstAndActivePlaylist = playlistsInfo[2]
  
  //const activePlaylistName = activePlaylist.playlistName
  currentPlaylistTableId = firstAndActivePlaylist.tableId
  
  //Запрашиваем первый плейлист
  currentPlaylist = await fetchPlaylist(baseId, currentPlaylistTableId)
  console.log('firstPlaylistTracks', currentPlaylist)
  playerState.initializePlayer(currentPlaylist);
  
  // const currentTableId = getCurrentTableId(playlistsInfo)
  // console.log('currentTableId:', currentTableId)
  
  const form = document.querySelector('#like-dislike-form')
  form.addEventListener('submit', e => {
    e.preventDefault()
    
    const submitter = e.submitter
    const like = submitter.id === 'like-button'
    const dislike = submitter.id === 'dislike-button'
    
    const currentPlaylistTableId = getCurrentTableId(playlistsInfo)
    console.log('form submission, currentTableId:', currentPlaylistTableId)
    
    const data = {
      currentPlaylistTableId,
      like,
      dislike
    }
    
    console.log('form data', data)
  })
  
}


// player 'play' settings and event handlers
const playButton = document.getElementById('play-button');
const skipButton = document.getElementById('skip-button');

skipButton.addEventListener('click', playerState.playAndLoadNextTrack());
playButton.addEventListener('click', togglePlayPause);

const fadeInOutDuration = 800; // 2000ms = 2 seconds
// set css custom variable for css animations
playButton.style.setProperty('--animation-duration', fadeInOutDuration + 'ms')

// player 'play' controls
function fadeAudioOutPause() {
  let volume = 1.0;
  
  const fadeInterval = setInterval(function () {
    volume -= 0.05;  // decrease by 0.05 until 0
    if (volume <= 0.0) {
      volume = 0.0;
      audioPlayer.pause();
      clearInterval(fadeInterval);
    }
    audioPlayer.volume = volume;
  }, fadeInOutDuration / 20);  // 20 intervals during the fade duration
}

function fadeAudioInPause() {
  let volume = 0.0;
  audioPlayer.volume = volume;
  audioPlayer.play();
  
  const fadeInterval = setInterval(function () {
    volume += 0.05;  // increase by 0.05 until 1.0
    if (volume >= 1.0) {
      volume = 1.0;
      clearInterval(fadeInterval);
    }
    audioPlayer.volume = volume;
  }, fadeInOutDuration / 20);  // 20 intervals during the fade duration
}

// player audio controls
function togglePlayPause() {
  if (audioPlayer.paused || audioPlayer.ended) {
    playButton.classList.add('playing');
    fadeAudioInPause();
  } else {
    playButton.classList.remove('playing');
    fadeAudioOutPause();
  }
  
  playButton.setAttribute('disabled', '')
  setTimeout(() => {
    playButton.removeAttribute('disabled')
  }, fadeInOutDuration)
}

// state

// let state = {};
//
// function updateState(signedUrlstring) {
//
//   for (const song of currentPlaylist) {
//     if (song.signedUrl === signedUrlstring) {
//       let id = song.id;
//
//       state = {
//         baseId: baseIdData,
//         tableId: currentPlaylistTableId,
//         recordId: id
//       }
//       console.log("state is ", state)
//       return;  // exit the function once the recordId is set
//     }
//   }
// }


// async function playlistButtonPush(chosenPlaylistTableId) {
//   // Use this function when onClick event occurs, when user changes the playlist
//   // by pushing on playlist plashka.
//
//   currentPlaylist = await fetchPlaylist(baseId, chosenPlaylistTableId);
//   playerInitialisation();
//   playerInfo.currentBlobURL = null;
//   playerInfo.nextBlobURL = null;
//
//   playerInfo.currentIntervalIndex = -1
//
//   playerInfo.currentTrackIndex = 0;
//   playerInfo.nextTrackIndex = 1;
//
// 	playerInitialisation();
//
// }

