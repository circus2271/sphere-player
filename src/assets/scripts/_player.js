import howler from 'howler'
import { sendLikeDislike, updateSongStats, fetchPlaylist, getCurrentTableId, shuffle } from './_helpers.js'
import { PlayerState } from './_playerState'
let currentPlaylist, currentPlaylistTableId;
let baseIdData;


const playerState = new PlayerState()

export const handlePlayer = async (playlistsInfo, baseId) => {
  baseIdData = baseId;
  console.log('hello from player')
  
  console.log('pip', playlistsInfo)
  // const firstAndActivePlaylist = playlistsInfo[0]
  const firstAndActivePlaylist = playlistsInfo[0]
  
  //const activePlaylistName = activePlaylist.playlistName
  currentPlaylistTableId = firstAndActivePlaylist.tableId
  
  //Запрашиваем первый плейлист
  currentPlaylist = await fetchPlaylist(baseId, currentPlaylistTableId)
  console.log('firstPlaylistTracks', currentPlaylist)
  await playerState.initializePlayer(currentPlaylist);
  
  
  // await playerState.playAndLoadNextTrack()
  // await playerState.playAndLoadNextTrack()
  // await playerState.playAndLoadNextTrack()
  //   alert(playerState.currentTrackIndex)
  // const currentTableId = getCurrentTableId(playlistsInfo)
  // console.log('currentTableId:', currentTableId)
  
  
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

