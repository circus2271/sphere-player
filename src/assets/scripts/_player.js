import fetchRetry from 'fetch-retry'
import { shuffle, sendLikeDislike, sendSongStats, fetchPlaylist } from './_helpers';

const fetchWithRetry = fetchRetry(fetch);

let likeDislikeStatus = {
  scheduled: false,
  newStatus: null
}

const likeButton = document.querySelector('#like-button')
const dislikeButton = document.querySelector('#dislike-button')

// parce an object parameter and get its newStatus key
const scheduleLikeDislike = ({ newStatus }) => {
  // make sure first letter is capitalized
  const firstLetter = newStatus[0].toUpperCase()
  const status = firstLetter + newStatus.toLowerCase().slice(1)

  if (status === 'Like') likeButton.classList.add('active')
  if (status === 'Dislike') dislikeButton.classList.add('active')

  likeDislikeStatus = {
    scheduled: true,
    newStatus: status
  }
}

const resetLikeDislikeScheduledValues = () => {
  // clean up
  likeButton.classList.remove('active')
  dislikeButton.classList.remove('active')

  likeDislikeStatus = {
    scheduled: false,
    newStatus: null
  }
}

let skipped = false

let playlistShouldChange = false

let globalRepeatId = null

const resetRepeatId = () => globalRepeatId = null

export class Player {
  currentTrackIndex = 0;
  nextTrackIndex = 1;
  tracks = null;
  currentIntervalData = null;
  nextBlobURL = null;
  currentBlobURL = null;
  nextIntervalFirstTrackBlobUrl = null;
  currentIntervalIndex = -1;
  currentPlaylistInitialData = null
  currentDayPlaylist = null;
  currentPlaylistTableId = null;
  currentPlaylistTableName = null;
  allButtons = document.querySelectorAll('button');
  audioPlayer = document.getElementById('audioPlayer');
  baseId = null;
  availablePlaylists = null;

  constructor() {
    if (!this.audioPlayer) {
      throw Error('Error: audioPlayer html element must be set for player to initialize')
    }

  }

  async initializePlayer(availablePlaylists, baseId) {
    this.availablePlaylists = availablePlaylists
    this.baseId = baseId

    // Запрашиваем первый плейлист
    const firstPlaylist = availablePlaylists[0]
    // обновляем все данные о плейлисте
    await this.setPlaylistData({ newPlaylist: firstPlaylist })

// debugger
    try {
      await this.initializeFirstTwoTracksOfAPlaylist({
        firstTrackLoaded: () => {
          this.initializePlayerHTMLControls();
          document.body.classList.add('first-track-loaded');
        }
      })
    } catch (error) {
      // console.log('no tracks')
      // this.initializePlayerHTMLControls()
      const currentIntervalLocalData = this.currentIntervalData
      debugger
      console.error(`can't first two tracks`)
    }

    this.audioPlayer.addEventListener('ended', async (event) => {
      // if playlist is changing, don't load next song of current playlist
      const playlistChange = playlistShouldChange
      // reset this global value
      playlistShouldChange = false

      document.getElementById('skip-button').disabled = true



      const currentTrackUrl = this.tracks[this.currentTrackIndex]
      console.log('currentDayPlaylist', this.currentDayPlaylist)

      const currentTrackInitialData = this.currentPlaylistInitialData.find(trackData => trackData.signedUrl === currentTrackUrl)
      const currentTrackId = currentTrackInitialData.id


      // this object will be sent to server
      const data = {
        baseId: this.baseId,
        tableId: this.currentPlaylistTableId,
        recordId: currentTrackId,
      }

      let trackWasDeleted;
      if (likeDislikeStatus.scheduled) {
        const newStatus = likeDislikeStatus.newStatus
        // set 'Like' or 'Dislike' that will be sent to server
        data.newStatus = newStatus

        if (newStatus === 'Dislike') {
          // delete track from current playlist locally
          this.tracks = this.tracks.filter(track => track !== currentTrackUrl)
          trackWasDeleted = true
        }

        setTimeout(() => {
          sendLikeDislike(data)
        }, 1200) // wait too overcome the 5 request per second limit
        resetLikeDislikeScheduledValues()
      }

      const stats = data
      stats.skipped = skipped
      stats.playlistName = this.currentPlaylistTableName
      stats.timestamp = new Date().toLocaleString("ru-RU")

      setTimeout(() => {
        sendSongStats(stats)
        // wait 3 seconds for hopefully pass airtable 5-requeste-at-once limit
      }, 3000)

      // reset skipped to initial value
      skipped = false

      console.log('audioPlayer ended')
      // if track is ended due to playlist change, don't load next track
      if (!playlistChange) {
        await this.playAndLoadNextTrack({ trackWasDeleted })
      }
    });

  }

  async setPlaylistData({ newPlaylist }) {
    // show user friendly message
    document.querySelector('#current-playlist').innerHTML = 'loading playlist...'

    this.currentPlaylistTableId = newPlaylist.tableId
    this.currentPlaylistTableName = newPlaylist.playlistName
    this.currentPlaylistInitialData = await fetchPlaylist(this.baseId, this.currentPlaylistTableId)
    this.currentDayPlaylist = this.getCurrentDaySongsInPlaylist(this.currentPlaylistInitialData);
    this.currentIntervalData = this.getCurrentInterval(this.currentDayPlaylist)
    this.currentIntervalIndex = this.currentIntervalData.index;
    this.tracks = this.currentIntervalData.signedUrls;
  }

  async initializeFirstTwoTracksOfAPlaylist({ firstTrackLoaded }) {
    document.querySelector('#current-playlist').innerHTML = 'loading first track...'

    // reset
    this.currentTrackIndex = 0;
    this.nextTrackIndex = 1;

    const retryFirstTrack = () => {
      return this.loadTrack({ tracks: this.tracks, trackIndex: this.currentTrackIndex})
      .catch(() => {

        this.currentTrackIndex++
        return retryFirstTrack()
      })
    }

    const retrySecondTrack = () => {
      return this.loadTrack({ tracks: this.tracks, trackIndex: this.nextTrackIndex })
      .catch(() => {

        this.nextTrackIndex++
        return retrySecondTrack()
      })
    }

    retryFirstTrack()
    .then(blobURL => {
      this.currentBlobURL = blobURL;

      this.audioPlayer.src = this.currentBlobURL;

      firstTrackLoaded()

      // show the name of a playlist to an user
      document.querySelector('#current-playlist').innerHTML = this.currentPlaylistTableName


      console.log('first blob should be ready');
      // document.getElementById('skip-button').disabled = true
      return retrySecondTrack();
    }).then(blobURL => {
      this.nextBlobURL = blobURL;

      document.getElementById('skip-button').disabled = false
      console.log('first two tracks of a playlist are initialized')
    }).catch(error => {
      console.error('Error setting the source for the audio player:', error);
    });
  }

  async playAndLoadNextTrack({ trackWasDeleted }) {
    const currentTrackSignedUrl = this.tracks[this.currentTrackIndex]
    const currentTrackData = this.currentPlaylistInitialData.find(record => {
      return record.signedUrl === currentTrackSignedUrl
    })
    const currentTrackDurationInSeconds = currentTrackData.fields['Duration in seconds']
    const currentTrackDurationInMilliSeconds = currentTrackDurationInSeconds * 1000

    const currentTime = new Date().getTime()
    const possibleEndOfTrackTimestamp = new Date( currentTime + currentTrackDurationInMilliSeconds)
    // const trackEndHour = possibleEndOfTrackTimestamp.getHours()
    // const trackEndHour = possibleEndOfTrackTimestamp.getHours()
    // const nextPossibleIntervalData = this.getCurrentInterval(this.currentDayPlaylist, new Date().getHours())
    const nextPossibleIntervalData = this.getCurrentInterval(this.currentDayPlaylist, possibleEndOfTrackTimestamp.getHours())

    const currentTrackPossiblyEndsAtANewInterval = nextPossibleIntervalData.index !== this.currentIntervalIndex
    const firstTrackOfANewIntervalPreloaded = this.nextIntervalFirstTrackBlobUrl !== null
    if (currentTrackPossiblyEndsAtANewInterval && !firstTrackOfANewIntervalPreloaded) {
      console.log('%cinterval', 'color: green', 'current track may end in a new interval')
      console.log('%cinterval', 'color: green','trying to preload first track of a new interval')
      this.loadTrack({tracks: nextPossibleIntervalData.signedUrls, trackIndex: 0 })
          // this track possibly will end on the next interval
          // so get first track of this interval as a blob
          // (to reduce loading time of this track as playlist switches)
          .then(blobURL => {
            this.nextIntervalFirstTrackBlobUrl = blobURL;
              console.log(
                  '%cinterval', 'color: green',
                  'newIntervalFirstTrackBlob loaded '
              )
            }
        ).catch(error => {
          console.error(
              '%cinterval', 'color: green',
              'an error occurred when prefetching a track from a new interval'
          )
          console.error(error)
      })
    }


    console.log('tracks[currentTrackIndex] and signedURL is ' + this.tracks[this.currentTrackIndex])
    if (this.nextBlobURL || this.nextIntervalFirstTrackBlobUrl) {
      // Revoke the blob URL of the track that just finished playing
      if (this.currentBlobURL) {
        URL.revokeObjectURL(this.currentBlobURL);
      }

      this.currentIntervalData = this.getCurrentInterval(this.currentDayPlaylist);
      // const intervalChanged = this.currentIntervalIndex !== this.currentIntervalData.index
      // const shouldChangeInterval = this.currentIntervalIndex !== this.currentIntervalData.index
      const intervalShouldBeChanged = () => this.currentIntervalIndex !== this.currentIntervalData.index
      if (intervalShouldBeChanged()) {
        if (this.nextIntervalFirstTrackBlobUrl) {
          this.currentBlobURL = this.nextIntervalFirstTrackBlobUrl
          this.nextIntervalFirstTrackBlobUrl = null
          this.nextBlobURL = null

          console.log(
              '%cinterval', 'color: green',
              'intervalShouldBeChanged, currentBlobURL = nextIntervalFirstTrackBlobUrl'
          )
        }

        if (!this.nextIntervalFirstTrackBlobUrl && this.nextBlobURL) {
          this.currentBlobURL = this.nextBlobURL;
          this.nextBlobURL = null;

          console.log(
              '%cinterval', 'color: green',
              'intervalShouldBeChanged, but there is no nextIntervalFirstTrackBlobUrl, so currentBlobURL gets from this.nextBlobURL'
          )
        }
      }

      if (this.nextBlobURL && !intervalShouldBeChanged()) {
        this.currentBlobURL = this.nextBlobURL;
        this.nextBlobURL = null;

        console.log(
            '%cinterval', 'color: green',
            'there is no intervalChange, so currentBlobURL gets from this.nextBlobURL')
      }

      this.audioPlayer.src = this.currentBlobURL;
      this.audioPlayer.play();
      // console.log(tracks[currentTrackIndex]);
      if (!trackWasDeleted) {
        // update indexes only if previous track wasnt' deleted
        // if track was deleted indexes remain the same
        this.currentTrackIndex = this.nextTrackIndex;
        this.nextTrackIndex++;
      }

      const retry = () => {
        console.log('retry track index:', this.nextTrackIndex)
        if (intervalShouldBeChanged()) {
          // if (this.currentIntervalIndex !== this.currentIntervalData.index) {
          // change interval
          console.log('%cinterval', 'color: green', 'interval has changed')
          console.log('%cinterval', 'color: green', 'switched playlist interval')
          console.log('%cinterval', 'color: green', 'current active interval is', this.currentIntervalData.time)
          this.currentIntervalIndex = this.currentIntervalData.index;
          this.tracks = this.currentIntervalData.signedUrls;
          this.nextTrackIndex = 0; // Start from the first track in the new interval
          // debugger
        } else if (this.nextTrackIndex >= this.tracks.length) {
          // If we're beyond the end of the current tracks, loop back to the start
          this.nextTrackIndex = 0;
        }

        return this.loadTrack({ tracks: this.tracks, trackIndex: this.nextTrackIndex })
          .catch(() => {
            this.nextTrackIndex++
            return retry()
          })
      }

      retry()
        .then(blobURL => {
          this.nextBlobURL = blobURL;
        // })
        // .then(() => {
          console.log('track loaded (with or without retry)')
          document.getElementById('skip-button').disabled = false
        });
    }
  }

  initializePlayerHTMLControls() {
    const audioPlayer = this.audioPlayer

    // player 'play' settings and event handlers
    const playButton = document.getElementById('play-button');
    const skipButton = document.getElementById('skip-button');

    // skipButton.addEventListener('click', () => this.playAndLoadNextTrack());
    skipButton.addEventListener('click', () => {
      // ставим флаг skipped в значение true
      skipped = true

      // здесь должна происходить перемотка трэка в конец,
      // чтобы потом автоматически сработала функция в onend у плеера,
      // там и отправляем всю статистику и данные
      // после отправки данных, возвращаем флаг в значение false (это уже в самом onend обработчике)
      this.audioPlayer.dispatchEvent(new Event('ended'))
    })
    playButton.addEventListener('click', togglePlayPause);

    const fadeInOutDuration = 800; // 2000ms = 2 seconds
    // set css custom variable for css animations
    playButton.style.setProperty('--animation-duration', fadeInOutDuration + 'ms')

    // player 'play' controls
    function fadeAudioToPlaying() {
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

    function fadeAudioToPause() {
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

    // get "exception" key from an object;
    // if no object -> use empty object by default
    const enableAllButtons = ({exception} = {}) => {
      this.allButtons.forEach(button => {
        // if (exception && button.id === exception) return
        button.disabled = false
      })
    }

    const disableAllButtons = () => {
      this.allButtons.forEach(button => {
        button.disabled = true
      })
    }

    // player audio controls
    function togglePlayPause() {
      if (audioPlayer.paused || audioPlayer.ended) {
        playButton.classList.add('playing');
        fadeAudioToPlaying();
      } else {
        playButton.classList.remove('playing');
        fadeAudioToPause();
      }

      temporaryDisableAllButtons()
    }

    const temporaryDisableButton = (button) => {
      button.setAttribute('disabled', '')
      setTimeout(() => {
        button.removeAttribute('disabled')
      }, fadeInOutDuration)
    }

    const temporaryDisableAllButtons = () => {
      this.allButtons.forEach(button => {
        temporaryDisableButton(button)
      })
    }

    // const disableButton = (button) => button.setAttribute('disabled', '')
    // const enableButton = (button) => button.removeAttribute('disabled')
    //
    //
    const fadeOutPlayingState = () => {
      playButton.classList.remove('playing')
      fadeAudioToPause()
    }

    // if playlist button is clicked
    // change playlist and load first two tracks of it
    document.querySelector('#playlists').addEventListener('click', async (event) => {

      // playlist button is clicked
      if (event.target.closest('.playlist')) {
        const playlistButton = event.target.closest('.playlist');
        // const playlistName = playlistButton.dataset.playlistName

        if (playlistButton.classList.contains('playlist--selected')) {
          console.log('playlist already selected');
          return;
        }
        resetRepeatId()


        document.querySelector('.playlist--selected').classList.remove('playlist--selected')
        playlistButton.classList.add('playlist--selected')

        const newPlaylistName = playlistButton.dataset.playlistName
        const newPlaylist = this.availablePlaylists.find(playlist => playlist.playlistName === newPlaylistName)

        fadeOutPlayingState()
        // disable all buttons until first track is ready
        disableAllButtons()

        // end current track, so statistics and 'like'/'dislike' could be sent
        skipped = true
        playlistShouldChange = true
        this.audioPlayer.dispatchEvent(new Event('ended'))


        await this.setPlaylistData({ newPlaylist })
        // cancel loadtrack repeating if playlist has changed
        // resetRepeatId()
        // new playlist is set
        // make sure data is updated

        try {
          await this.initializeFirstTwoTracksOfAPlaylist({
            firstTrackLoaded: () => {
              enableAllButtons({exception: 'skip-button'})
            }
          })
        } catch (error) {
          console.error(`playlist error: can't load first two tracks of a new playlist`)
        }
      }
    })

    const form = document.querySelector('#like-dislike-form')
    form.addEventListener('submit', e => {
      e.preventDefault()

      const submitter = e.submitter
      const like = submitter.id === 'like-button'
      const dislike = submitter.id === 'dislike-button'

      if (like) {
        if (likeDislikeStatus.scheduled && likeDislikeStatus.newStatus === 'Like') {
          resetLikeDislikeScheduledValues()

          return
        }

        if (likeDislikeStatus.scheduled && likeDislikeStatus.newStatus === 'Dislike') {
          resetLikeDislikeScheduledValues()
        }

        scheduleLikeDislike({ newStatus: 'Like' })
      }

      if (dislike) {
        if (likeDislikeStatus.scheduled && likeDislikeStatus.newStatus === 'Dislike') {
          resetLikeDislikeScheduledValues()

          return
        }

        if (likeDislikeStatus.scheduled && likeDislikeStatus.newStatus === 'Like') {
          resetLikeDislikeScheduledValues()
        }

        scheduleLikeDislike({ newStatus: 'Dislike' })
      }
    })


    // finally, enable all buttons
    enableAllButtons({exception: 'skip-button'})
  }

  loadTrack({ tracks, trackIndex }) {
    // This function calls function which sets correct interval. It changes index to 0 if interval changes,
    // or we should start from the beginning.
    // Then it loads new track to blob.

    // use this to handle (cancel) retries
    const localRepeatId = new Date().getTime();
    globalRepeatId = localRepeatId

    console.log('ppp', tracks[trackIndex])
    return fetchWithRetry(tracks[trackIndex], {
      retryDelay: 1000,
      // retryDelay: 0,
      retryOn: function (attempt, error, response) {
        console.log('get second', new Date().getSeconds())

        if (response && response.status === 404) {
          // похоже что у этого трэка битая ссылка
          //
          console.warn('fetch error, 404, track not found')
          return false
        }

        if (localRepeatId !== globalRepeatId) {
          console.log('reset counter')
          console.log('cancel this track loading')
          return false;
        }

        if (error !== null || response.status >= 500 ) {
          // что-то не то, -- делаем повтор запроса
          console.log('ошибка при получении песни')
          console.log('делаем повтор запроса...')
          // console.log('error111', error)
          console.log('повтор номер', attempt + 1)
          return true;
        }
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.blob();
    })
    .then(blob => {
      if (blob.size > 0) {
        console.log('Successfully fetched and have content in blob.');
        return URL.createObjectURL(blob);
      } else {
        console.warn('Fetch was successful but blob is empty.');
      }
    })
  }

    getCurrentInterval(data, hour) {
      // This function aims to find the current time interval (based on the hour of the day) from a given list of intervals,
      // and return the associated URLs and the index of the interval within the provided list.

      // name of this constant is not enough correct, but now it's better then rename all the things
      // this should be named something like "relatedHour"
      const currentHour = hour || new Date().getHours(); // Get the current hour (0 - 23)

      const currentInterval = data.find((interval, i) => {
        const [start, end] = interval.time.split('-').map(Number); // Convert "12-15" to [12, 15]

        // Adjust for times wrapping midnight, e.g., "23-2"
        if (start > end) {
          return currentHour >= start || currentHour < end
        } else {
          return currentHour >= start && currentHour < end
        }
      })

      // console.log('currentIII', currentInterval)

      if (currentInterval) {
        // {time:'11-12', signedUrls: [...], index: 1}
        // {time:'11-12', signedUrls: [...], index: 0}
        // {time:'12-21', signedUrls: [...], index: 9}
        return currentInterval
      }


      return { time: undefined, signedUrls: [], index: -1 }; // Default return if no matching interval is found
    }

    // returns array of objects
    // for example: [{ time: "8-12", signedUrls: ["1.mp3", "2.mp3", "3.mp3"] }, {...} ]
    getCurrentDaySongsInPlaylist(playlistArray) {
      // THIS function works (getting as an argument) the whole playlist with all the days intervals
      // IT RETURNS the array with intervals for a particular day. The result of interval sets is time-sorted

      // Get the current day
      const currentDate = new Date();
      const currentDay = currentDate.toLocaleString('en-US', { weekday: 'long' });

      // Define an object to store intervals and their respective songs
      const songIntervals = {};
      //console.log('playlistObj is ', playlistObj)

      playlistArray.forEach(song => {
        // Check if the song has an interval for the current day
        const interval = song.fields[currentDay];
        if (interval) {
          // Check if we already have this interval in the songIntervals object
          if (!songIntervals[interval]) {
            songIntervals[interval] = [];
          }
          // Add the song's signedUrl to the interval array
          songIntervals[interval].push(song.signedUrl);
        }
      });


      // Convert songIntervals object to the desired array format
      const result = [];
      // for (const interval in songIntervals) {
      // debugger
      Object.keys(songIntervals).forEach((interval, index) => {
        result.push({
          time: interval,
          signedUrls: shuffle(songIntervals[interval]), // Assuming shuffle is a function you've defined elsewhere
          index: index
        });
      })

      // Now, let's sort the intervals
      result.sort((a, b) => {
        const [startA, endA] = a.time.split('-').map(Number);
        const [startB, endB] = b.time.split('-').map(Number);

        // Handle cases where interval wraps around midnight
        if (startA > endA && (startB <= endB || startA < startB)) return 1;
        if (startB > endB && (startA <= endA || startB < startA)) return -1;

        return startA - startB;
      });

      // We get here array of objects which look like this, they are sorted from early to late:
      // { time: "8-12", signedUrls: ["1.mp3", "2.mp3", "3.mp3"] },
      // { time: "12-16", signedUrls: ["4.mp3", "5.mp3", "6.mp3"] },
      // { time: "16-20", signedUrls: ["7.mp3", "8.mp3", "9.mp3"] }
      // console.log('resultlll', result)
      // debugger
      return result;
    }

  }
