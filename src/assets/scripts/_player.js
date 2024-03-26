import fetchRetry from 'fetch-retry'
import {randomize, sendLikeDislike, sendSongStats, fetchPlaylist, preloadEnoughOfAudioSrc} from './_helpers';

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
  // track urls are used as a lightweight version of id
  currentTrackUrl = null;
  nextTrackUrl = null;
  tracks = null;
  currentIntervalData = null;
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


    try {
      await this.initializeFirstTwoTracksOfAPlaylist({
        firstTrackLoaded: () => {
          this.initializePlayerHTMLControls();
          document.body.classList.add('first-track-loaded');
        }
      })
    } catch (error) {
      console.error(`can't first two tracks`)
    }

    this.audioPlayer.addEventListener('ended', async (event) => {
      // if playlist is changing, don't load next song of current playlist
      const playlistChange = playlistShouldChange
      // reset this global value
      playlistShouldChange = false

      document.getElementById('skip-button').disabled = true



      const currentTrackUrl = this.currentTrackUrl

      const currentTrackInitialData = this.currentPlaylistInitialData.find(trackData => trackData.fields['Full link'] === currentTrackUrl)
      // debugger;
      console.log('%ccurrentTrackIndex', 'color: green', this.currentTrackIndex)
      console.log('currentTrackUrl', currentTrackUrl)
      console.log('currentTrackInitialData', currentTrackInitialData)
      const currentTrackId = currentTrackInitialData.id
      // debugger


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
    const currentInterval = this.getCurrentInterval(this.currentDayPlaylist)
    this.currentIntervalData = this.getCurrentIntervalRelatedData(currentInterval)
    this.currentIntervalIndex = this.currentIntervalData.index;
    this.tracks = this.currentIntervalData.urls;
  }

  async initializeFirstTwoTracksOfAPlaylist({ firstTrackLoaded }) {
    document.querySelector('#current-playlist').innerHTML = 'loading first track...'

    // reset
    this.currentTrackIndex = 0;
    this.nextTrackIndex = 1;
    this.currentTrackUrl = null;
    this.nextTrackUrl = null;

    // обходим ошибки с потерей контекста
    // const tracks = this.tracks
    // const nextTrackIndex = this.nextTrackIndex
    // const currentTrackIndex = this.currentTrackIndex

    const retryFirstTrack = async () => {

      if (this.tracks.length === 0) {
        console.warn('there are no tracks to preload')

        // return
      }

      const trackUrl = this.tracks[this.currentTrackIndex]

      return preloadEnoughOfAudioSrc(trackUrl)
      .catch(() => {
        // try with a next track
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
    .then(currentTrackUrl => {
      // save this value to a Player property
      // p.s you can also get this value from this.tracks array (by index)
      // this.currentTrackUrl = this.tracks[this.currentTrackIndex]
      this.currentTrackUrl = currentTrackUrl

      // we don't use blob preloading for a first track of a playlist
      // just use signedUrl as is
      // (now we're already have some audio preloaded,
      // and it should be enough to play this track to an end without interruption)
      this.audioPlayer.src = this.currentTrackUrl;

      firstTrackLoaded()

      // show the name of a playlist to an user
      document.querySelector('#current-playlist').innerHTML = this.currentPlaylistTableName


      // console.log('first blob should be ready');
      console.log('first track should be ready to play to an end');
      // document.getElementById('skip-button').disabled = true
      return retrySecondTrack();
    }).then(nextTrackUrl => {
      this.nextTrackUrl = nextTrackUrl

      document.getElementById('skip-button').disabled = false
      console.log('first two tracks of a playlist are initialized')
    }).catch(error => {
      console.error('Error setting the source for the audio player:', error);
    });
  }

  async playAndLoadNextTrack({ trackWasDeleted }) {
    // debugger
    // If there is a next track
    // updateState(tracks[currentTrackIndex]);
    // console.log('tracks[currentTrackIndex] and signedURL is ' + this.tracks[this.currentTrackIndex])
    console.log('tracks[currentTrackIndex] and encodedURL is ' + this.tracks[this.currentTrackIndex])
    if (this.nextTrackUrl) {
      this.currentTrackUrl = this.nextTrackUrl
      this.nextTrackUrl = null;
      this.audioPlayer.src = this.currentTrackUrl;
      this.audioPlayer.play();
      // console.log(tracks[currentTrackIndex]);
      if (!trackWasDeleted) {
        // update indexes only if previous track wasnt' deleted
        // if track was deleted indexes remain the same
        this.currentTrackIndex = this.nextTrackIndex;
        this.nextTrackIndex++;
      }

      this.currentIntervalData = this.getCurrentInterval(this.currentDayPlaylist);

      const retry = () => {
        console.log('retry track index:', this.nextTrackIndex)
        // console.log('currentIIndex', this.currentIntervalIndex)
        if (this.currentIntervalIndex !== this.currentIntervalData.index) {
          console.log('switched playlist interval')
          console.log('current active interval is', this.currentIntervalData.time)
          this.currentIntervalIndex = this.currentIntervalData.index;
          // this.tracks = this.currentIntervalData.signedURLs;
          this.tracks = this.currentIntervalData.encodedURLs;
          this.nextTrackIndex = 0; // Start from the first track in the new interval
          // debugger
        } else if (this.nextTrackIndex >= this.tracks.length) {
          // If we're beyond the end of the current tracks, loop back to the start
          this.nextTrackIndex = 0;
        }

        // debugger
        return this.loadTrack({ tracks: this.tracks, trackIndex: this.nextTrackIndex })
          .catch(() => {
            this.nextTrackIndex++
            return retry()
          })
      }

      retry()
        .then(trackUrl => {
          this.nextTrackUrl = trackUrl

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
        if (exception && button.id === exception) return
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

    const trackUrl = tracks[trackIndex]
    return fetchWithRetry(trackUrl, {
      retryDelay: 1000,
      // retryDelay: 0,
      method: 'HEAD',
      retryOn: function (attempt, error, response) {
        // alert(1)
        // console.log('ro', new Date().getTime())
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
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return preloadEnoughOfAudioSrc(trackUrl)
    })
  }

    getCurrentInterval(data) {
      // This function aims to find the current time interval (based on the hour of the day) from a given list of intervals,
      // and return the associated URLs and the index of the interval within the provided list.

      const currentHour = new Date().getHours(); // Get the current hour (0 - 23)

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
        const index = data.findIndex(interval => interval.time === currentInterval.time)
        currentInterval.index = index
      }

      return currentInterval
      // {time:'11-12', signedURLs: [...]}
      // {time:'11-12', signedURLs: [...], index: 0}
      // {time:'12-21', signedURLs: [...], index: 9}
    }

    getCurrentIntervalRelatedData(currentInterval) {
      if (currentInterval) {
        // console.log('currentII', currentInterval)
        return {
          // urls: currentInterval.signedURLs,
          urls: currentInterval.encodedURLs,
          index: currentInterval.index
        };
      }

      return { urls: [], index: -1 }; // Default return if no matching interval is found
    }


    // returns array of objects
    // for example: [{ time: "8-12", signedURLs: ["1.mp3", "2.mp3", "3.mp3"] }, {...} ]
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
          // songIntervals[interval].push(song.signedUrl);
          songIntervals[interval].push(song.fields['Full link']);
        }
      });


      // Convert songIntervals object to the desired array format
      const result = [];
      for (const interval in songIntervals) {
        result.push({
          time: interval,
          // signedURLs: randomize(songIntervals[interval]), // Assuming shuffle is a function you've defined elsewhere
          encodedURLs: randomize(songIntervals[interval]) // Assuming shuffle is a function you've defined elsewhere
        });
      }

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
      // { time: "8-12", signedURLs: ["1.mp3", "2.mp3", "3.mp3"] },
      // { time: "12-16", signedURLs: ["4.mp3", "5.mp3", "6.mp3"] },
      // { time: "16-20", signedURLs: ["7.mp3", "8.mp3", "9.mp3"] }
      // console.log('resultlll', result)
      return result;
    }

  }
