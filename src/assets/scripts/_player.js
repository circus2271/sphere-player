import { shuffle, sendLikeDislike, updateSongStats, fetchPlaylist } from './_helpers';


let likeDislikeStatus = {
  scheduled: false,
  newStatus: null
}

// parce an object parameter and get its newStatus key
const scheduleLikeDislike = ({ newStatus }) => {
  // make sure first letter is capitalized
  const firstLetter = newStatus[0].toUpperCase()
  const status = firstLetter + newStatus.toLowerCase().slice(1)
  
  likeDislikeStatus = {
    scheduled: true,
    newStatus: status
  }
}

const resetLikeDislikeScheduledValues = () => {
  likeDislikeStatus = {
    scheduled: false,
    newStatus: null
  }
}

let skipped = false

export class Player {
  currentTrackIndex = 0;
  nextTrackIndex = 1;
  tracks = null;
  currentIntervalData = null;
  nextBlobURL = null;
  currentBlobURL = null;
  currentIntervalIndex = -1;
  currentDayPlaylist = null;
  currentPlaylistTableId = null;
  currentPlaylistTableName = null;
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
    
    
    console.log(this.tracks[this.currentTrackIndex]);
    //console.log('firstPlaylist is', firstPlaylist)
    console.log('currentDayPlaylist is ', this.currentDayPlaylist)
  
    try {
      await this.initializeFirstTwoTracksOfAPlaylist()
    } catch (error) {
      // console.log('no tracks')
      // this.initializePlayerHTMLControls()
      console.error(`can't first two tracks`)
    }
    
    this.audioPlayer.addEventListener('ended', async (event) => {
      // alert('ended')
      const track = this.tracks[this.currentTrackIndex]
      // debugger
  
  
      const data = {
        baseId: this.baseId,
        tableId: this.currentPlaylistTableId,
        recordId: track.id,
      }
  
  
      if (likeDislikeStatus.scheduled) {
        // set new status...
        const newStatus = likeDislikeStatus.newStatus
        if (newStatus) data.newStatus = newStatus
    
        await sendLikeDislike(data)
        resetLikeDislikeScheduledValues()
      }
  
      const stats = data
      stats.skipped = skipped
      stats.playlistName = this.currentPlaylistTableName
  
      setTimeout(async () => {
        await sendSongStats(stats)
        // wait 3 seconds for hopefully pass airtable 5-requeste-at-once limit
      }, 3000)
  
      // reset skipped to initial value
      skipped = false
      
      console.log('audioPlayer ended')
      await this.playAndLoadNextTrack()
    });
    
  }
  
  async setPlaylistData({ newPlaylist }) {
    this.currentPlaylistTableId = newPlaylist.tableId
    this.currentPlaylistTableName = newPlaylist.playlistName
    const currentPlaylist = await fetchPlaylist(this.baseId, this.currentPlaylistTableId)
    this.currentDayPlaylist = this.getCurrentDaySongsInPlaylist(currentPlaylist);
    const currentInterval = this.getCurrentInterval(this.currentDayPlaylist)
    this.currentIntervalData = this.getCurrentIntervalRelatedData(currentInterval)
    this.currentIntervalIndex = this.currentIntervalData.index;
    this.tracks = this.currentIntervalData.urls;
    // debugger
  }
  
  async initializeFirstTwoTracksOfAPlaylist() {
  
    // обходим ошибки с потерей контекста
    const tracks = this.tracks
    const nextTrackIndex = this.nextTrackIndex
    const currentTrackIndex = this.currentTrackIndex
  
    await this.loadTrack(tracks, currentTrackIndex).then(blobURL => {
      this.currentBlobURL = blobURL;
    
      this.audioPlayer.src = this.currentBlobURL;
    
      // здесь первый трэк уже получен, поэтому можно сделать кнопки кликабельными
      this.initializePlayerHTMLControls()
      document.body.classList.add('first-track-loaded')
    
      console.log('first blob should be ready');
      return this.loadTrack(tracks, nextTrackIndex);
    
    }).then(blobURL => {
      this.nextBlobURL = blobURL;
      
      console.log('first two tracks of a playlist are initialized')
    }).catch(error => {
      console.error('Error setting the source for the audio player:', error);
    });
  }
  
  async sendDataOnSongEnd(track) {
    
    const data = {
      baseId: this.baseId,
      tableId: this.currentPlaylistTableId,
      recordId: track.id,
    }
    
    
    if (likeDislikeStatus.scheduled) {
      // set new status...
      const newStatus = likeDislikeStatus.newStatus
      if (newStatus) data.newStatus = newStatus
      
      await sendLikeDislike(data)
      resetLikeDislikeScheduledValues()
    }
    
    setTimeout(async () => {
      const stats = data
      stats.skipped = skipped
      stats.playlistName = this.currentPlaylistTableName
      
      await sendSongStats(stats)
      // reset skipped to initial value
      skipped = false
      
      // wait 3 seconds for hopefully pass airtable 5-requeste-at-once limit
    }, 3000)
  }
  
  async playAndLoadNextTrack() {
    // debugger
    // If there is a next track
    // updateState(tracks[currentTrackIndex]);
    console.log('tracks[currentTrackIndex] and signedURL is ' + this.tracks[this.currentTrackIndex])
    if (this.nextBlobURL) {
      // Revoke the blob URL of the track that just finished playing
      if (this.currentBlobURL) {
        URL.revokeObjectURL(this.currentBlobURL);
      }
      
      this.currentBlobURL = this.nextBlobURL;
      this.currentTrackIndex = this.nextTrackIndex;
      this.nextBlobURL = null;
      this.audioPlayer.src = this.currentBlobURL;
      this.audioPlayer.play();
      // console.log(tracks[currentTrackIndex]);
      this.nextTrackIndex++;
      //console.log("(checking in audioPlayer on end event) tracks lenght is — " + tracks.length);
      //console.log("(checking in audioPlayer on end event) currentTrackIndex (after ++ above) — " + currentTrackIndex);
      
      this.currentIntervalData = this.getCurrentInterval(this.currentDayPlaylist);
      
      if (this.currentIntervalIndex !== this.currentIntervalData.index) {
        this.currentIntervalIndex = this.currentIntervalData.index;
        this.tracks = this.currentIntervalData.urls;
        this.nextTrackIndex = 0; // Start from the first track in the new interval
      } else if (this.nextTrackIndex >= this.tracks.length) {
        // If we're beyond the end of the current tracks, loop back to the start
        this.nextTrackIndex = 0;
      }
      
      await this.loadTrack(this.tracks, this.nextTrackIndex).then(blobURL => {
        this.nextBlobURL = blobURL;
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
      
      temporaryDisableButton(playButton)
    }
    
    const temporaryDisableButton = (button) => {
      button.setAttribute('disabled', '')
      setTimeout(() => {
        button.removeAttribute('disabled')
      }, fadeInOutDuration)
    }
    
    
    // if playlist button is clicked
    // change playlist and load first two tracks of it
    document.querySelector('#playlists').addEventListener('click', async (event) => {
      
      if (event.target.closest('.playlist')) {
        const playlistEl = event.target.closest('.playlist');
        const playlistName = playlistEl.dataset.playlistName
        
        document.querySelector('.playlist--selected').classList.remove('playlist--selected')
        playlistEl.classList.add('playlist--selected')
        
        const newPlaylistName = playlistEl.dataset.playlistName
        const newPlaylist = this.availablePlaylists.find(playlist => playlist.playlistName === newPlaylistName)
        
        document.querySelector('#current-playlist').innerHTML = 'loading playlist...'
        
        // disable playlist button until the response is here
        const disablePlaylistButton = () => playlistEl.setAttribute('disabled', '')
        const enablePlaylistButton = () =>  playlistEl.removeAttribute('disabled')
        
        disablePlaylistButton()
        await this.setPlaylistData({ newPlaylist })
        
        // new playlist is set
        // make sure data is updated
        const updatedPlaylistName = this.currentPlaylistTableName
        document.querySelector('#current-playlist').innerHTML = updatedPlaylistName
        console.log('new playlist:', this.tracks)
        
        try {
          await this.initializeFirstTwoTracksOfAPlaylist()
        } catch (error) {
          console.error(`playlist error: can't load first two tracks of a new playlist`)
        } finally {
          enablePlaylistButton()
        }
        // debugger
      }
    })
    
    const form = document.querySelector('#like-dislike-form')
    form.addEventListener('submit', e => {
      e.preventDefault()
      
      const submitter = e.submitter
      const like = submitter.id === 'like-button'
      const dislike = submitter.id === 'dislike-button'
      
      
      if (like) {
        scheduleLikeDislike({ newStatus: 'Like' })
      }
      
      if (dislike) {
        scheduleLikeDislike({ newStatus: 'Dislike' })
      }
      
      // alert(likeDislikeStatus.newStatus)
    })
    
    
    // finally, enable all buttons
    const buttons = document.querySelectorAll('button')
    buttons.forEach(button => button.removeAttribute('disabled'))
  }
  
  loadTrack(tracks, index) {
    // This function calls function which sets correct interval. It changes index to 0 if interval changes,
    // or we should start from the beginning.
    // Then it loads new track to blob.
    
    console.log('ppp', tracks[index])
    return fetch(tracks[index])
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
      .catch(e => {
        // here will be good idea to try to load track once (but need to track how many tries)
        // or load +1. anyway its good idea to place setTimer
        console.error(e);
      });
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
    
    if (currentInterval) {
      const index = data.findIndex(interval => interval.time === currentInterval.time)
      currentInterval.index = index
    }
    
    return currentInterval
    
  }
  
  getCurrentIntervalRelatedData(currentInterval) {
    if (currentInterval) {
      return {
        urls: currentInterval.signedURLs,
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
        songIntervals[interval].push(song.signedUrl);
      }
    });
    
    
    // Convert songIntervals object to the desired array format
    const result = [];
    for (const interval in songIntervals) {
      result.push({
        time: interval,
        signedURLs: shuffle(songIntervals[interval]) // Assuming shuffle is a function you've defined elsewhere
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
    return result;
  }
  
}
