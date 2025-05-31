import {collectData, sendLikeDislike, sendSongStats, setPlayerTitle} from './utils/_helpers';
import { initializePlayerHTMLControls } from './_controls';
import { loadTrack } from './utils/_loadTrack';
import PlayerState from './playerState/PlayerState';
import { likeDislikeService } from './utils/_likeDislikeService';


export class Player {
  currentTrackIndex = 0;
  nextTrackIndex = 1;
  currentTrackId = null;
  nextTrackId = null;
  nextBlobURL = null;
  currentBlobURL = null;
  audioPlayer = document.getElementById('audioPlayer');
  nextTrackDownloadSpeed = null
  nextTrackDownloadTime = null


  constructor() {
    if (!this.audioPlayer) {
      throw Error('Error: audioPlayer html element must be set for player to initialize')
    }
  }

  async initializePlayer(availablePlaylists, baseId, playlist = null) {
    this.playerState = new PlayerState({availablePlaylists, baseId})

    // Запрашиваем первый плейлист
    const firstPlaylist = availablePlaylists[0]
    // обновляем все данные о плейлисте
    await this.playerState.playlist.setPlaylistData({ newPlaylist: playlist || firstPlaylist })


    try {
      await this.initializeFirstTwoTracksOfAPlaylist({
        firstTrackLoaded: () => {
          initializePlayerHTMLControls(this); // )
          document.body.classList.add('first-track-loaded');
        }
      })
    } catch (error) {
      console.error(error)
      console.error(`can't load first 2 tracks`)
    }

    // this.audioPlayer.addEventListener('ended', async () => this.onTrackEnd())
    // it's made to avoid complexity when reinitializing a player
    // so it's not needed to manually unsubscribe from addEventListener (it's not needed to call removeEventListener)
    this.audioPlayer.onended = async (e) => this.onTrackEnd(e.detail)
    this.audioPlayer.onerror = () => this.onError();
  }

  async initializeFirstTwoTracksOfAPlaylist({ firstTrackLoaded }) {
    setPlayerTitle('loading first track...')

    // reset
    this.currentTrackIndex = 0;
    this.nextTrackIndex = 1;
// debugger
    const retryFirstTrack = () => {
      // debugger
      return loadTrack({ tracks: this.playerState.playlist.tracks, trackIndex: this.currentTrackIndex, player: this})
      .catch(() => {

        this.currentTrackIndex++
        return retryFirstTrack()
      })
    }

    const retrySecondTrack = () => {
      return loadTrack({ tracks: this.playerState.playlist.tracks, trackIndex: this.nextTrackIndex, player: this })
      .catch(() => {

        this.nextTrackIndex++
        return retrySecondTrack()
      })
    }

    retryFirstTrack()
    .then(blobURL => {
      this.currentBlobURL = blobURL;
      this.currentTrackId = this.playerState.playlist.getTrackId(this.currentTrackIndex) // should be defined

      this.audioPlayer.src = this.currentBlobURL;

      firstTrackLoaded()

      // show the name of a playlist to an user

      setPlayerTitle(this.playerState.playlist.currentPlaylistTableName)

      console.log('first blob should be ready');
      return retrySecondTrack();
    }).then(blobURL => {
      this.nextBlobURL = blobURL;
      this.nextTrackId = this.playerState.playlist.getTrackId(this.nextTrackIndex)

      document.getElementById('skip-button').disabled = false
      console.log('first two tracks of a playlist are initialized')
    }).catch(error => {
      console.error('Error setting the source for the audio player:', error);
    });
  }

  async onTrackEnd({skipped, playlistShouldChange, data}) {

    document.getElementById('skip-button').disabled = true


    if (!data) {
      data = collectData(this)
    }



    this.nextTrackDownloadSpeed = null
    this.nextTrackDownloadTime = null

    let trackWasDeleted;
    if (likeDislikeService.likeDislikeStatus.scheduled) {
      const newStatus = likeDislikeService.likeDislikeStatus.newStatus
      // set 'Like' or 'Dislike' that will be sent to server
      data.newStatus = newStatus

      if (newStatus === 'Dislike') {
        // delete track from current playlist locally
        this.playerState.playlist.removeTrack(data.currentTrackId)
        trackWasDeleted = true
      }

      setTimeout(() => {
        sendLikeDislike(data)
      }, 1200) // wait too overcome the 5 request per second limit
      likeDislikeService.resetLikeDislikeScheduledValues()
    }

    const stats = data
    stats.skipped = skipped
    stats.playlistName = this.playerState.playlist.currentPlaylistTableName
    stats.timestamp = new Date().toLocaleString('ru-RU')

    setTimeout(() => {
      sendSongStats(stats)
      // wait 3 seconds for hopefully pass airtable 5-requeste-at-once limit
    }, 3000)

    console.log('audioPlayer ended')
    // if track is ended due to playlist change, don't load next track
    if (!playlistShouldChange) {
      await this.playAndLoadNextTrack({trackWasDeleted})
    }
  }

  onError(event, reason) {
    console.log('%ccurrentTrackIndex', 'color: green', this.currentTrackIndex)

    // const currentTrackId = currentTrackInitialData.id
    const currentTrackId = this.currentTrackId
    // Build the same stats payload you use on 'ended'

    const data = {
      baseId:          this.playerState.baseId,
      tableId:         this.playerState.playlist.currentPlaylistTableId,
      // recordId:        this.currentTrackId,       // same ID you use in 'ended'
      recordId:        currentTrackId,       // same ID you use in 'ended'
      currentIndex:    this.currentTrackIndex,
      downloadingSpeed: '',                        // no new download here
      downloadingTime:  ''
    };

    // Mirror your 'ended' logic
    const stats = data;
    stats.playlistName = this.playerState.playlist.currentPlaylistTableName;
    stats.timestamp    = new Date().toLocaleString('ru-RU');
    stats.networkError = reason || event.message ||
        (this.audioPlayer.error && `Code ${this.audioPlayer.error.code}`);

    // Send with the same 3-second debounce to avoid rate-limits
    setTimeout(() => {
      sendSongStats(stats);
    }, 2200);

    console.warn('Audio playback error, stats sent:', stats);
  }

  async playAndLoadNextTrack({ trackWasDeleted }) {

    // const p = this.playerState
    // debugger
    // console.log('tracks[currentTrackIndex] and encodedURL is ' + playlist.getTrackByIndex(this.currentTrackIndex).url)
    console.log('tracks[currentTrackIndex] and encodedURL is ' + this.playerState.allTracks[this.currentTrackId].url)

    // If there is a next track
    if (this.nextBlobURL) {
      // Revoke the blob URL of the track that just finished playing
      if (this.currentBlobURL) {
        URL.revokeObjectURL(this.currentBlobURL);
      }

      this.currentBlobURL = this.nextBlobURL;
      this.nextBlobURL = null;
      this.currentTrackId = this.nextTrackId
      this.nextTrackId = null
      this.audioPlayer.src = this.currentBlobURL;
      this.audioPlayer.play();

      if (!trackWasDeleted) {
        // update indexes only if previous track wasn't deleted
        // if track was deleted indexes remain the same
        this.currentTrackIndex = this.nextTrackIndex;
        this.nextTrackIndex++;
      }

      // it's a temporary local variable
      // const currentInterval = intervalManager.getCurrentInterval(this.currentDayPlaylist);
      // const currentIntervalData = intervalManager.getCurrentIntervalRelatedData(currentInterval)

      const possiblyNewInterval = this.playerState.playlist.intervalManager.currentInterval
      if (possiblyNewInterval.index === -1) {
        // switched to no interval time
        this.playerState.playlistEnded = true

        console.warn('playlist has ended')
        console.warn('if user presses play and there is a new interval already, a player should reinitialize')

        return
      }


      const retry = () => {
        console.log('retry track index:', this.nextTrackIndex)

        if (this.playerState.playlist.intervalManager.currentInterval.index !== possiblyNewInterval.index) {
          console.log('switched playlist interval')
          console.log('current active interval is', possiblyNewInterval.time)

          this.playerState.playlist.setTracksFromCurrentInterval()

          this.nextTrackIndex = 0; // Start from the first track in the new interval
        } else if (this.nextTrackIndex >= this.playerState.playlist.tracks.length) {
          // If we're beyond the end of the current tracks, loop back to the start
          this.nextTrackIndex = 0;
        }

        const downloadingTimeStart = new Date().getTime()
        let downLoadingTimeEnd;

        return loadTrack({ tracks: this.playerState.playlist.tracks, trackIndex: this.nextTrackIndex, returnOnlyBlob: true, player: this })
            .then((blob) => {
              // on success, calculate how much time it took to download this track
              downLoadingTimeEnd = new Date().getTime()
              const downloadTimeInSeconds = (downLoadingTimeEnd - downloadingTimeStart) / 1000

              if (blob.size > 0) {
                const blobSizeMb = blob.size / 1024 / 1024
                this.nextTrackDownloadTime = downloadTimeInSeconds
                this.nextTrackDownloadSpeed = blobSizeMb/downloadTimeInSeconds

                console.log('Successfully fetched and have content in blob.');
                return URL.createObjectURL(blob);
              } else {
                console.warn('Fetch was successful but blob is empty.');

                return null
              }
            })
          .catch(() => {
            this.nextTrackIndex++
            return retry()
          })
      }

      retry()
        .then(blobURL => {
          this.nextBlobURL = blobURL;
          this.nextTrackUrl = this.playerState.playlist.tracks[this.nextTrackIndex].url

          console.log('track loaded (with or without retry)')
          document.getElementById('skip-button').disabled = false
        });
    }
  }

}
