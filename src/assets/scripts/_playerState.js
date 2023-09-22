export class PlayerState {
  currentTrackIndex = 0;
  nextTrackIndex = 1;
  playlist = null;
  currentIntervalData = null;
  nextBlobURL = null;
  currentBlobURL = null;
  currentIntervalIndex = -1;
  currentDayPlaylist = null;
  audioPlayer = document.getElementById('audioPlayer');
  
  constructor() {
    if (!this.audioPlayer) {
      throw Error('Error: audioPlayer html element must be set for player to initialize')
    }
    
  }
  
  initializePlayer(currentPlaylist) {
    this.initializePlayerHTMLControls()
    
    console.log('firstPlaylistTracks inside playerInitialisation', currentPlaylist)
    this.currentDayPlaylist = getCurrentDaySongsInPlaylist(currentPlaylist);
    
    const currentInterval = getCurrentInterval(this.currentDayPlaylist)
    
    
    this.currentIntervalData = getCurrentIntervalRelatedData(currentInterval)
    this.currentIntervalIndex = this.currentIntervalData.index;
    this.playlist = this.currentIntervalData.urls;
    console.log(this.playlist[this.currentTrackIndex]);
    //console.log('firstPlaylist is', firstPlaylist)
    console.log('currentDayPlaylist is ', this.currentDayPlaylist)
    
    this.loadTrack(this).then(blobURL => {
      this.currentBlobURL = blobURL;
      audioPlayer.src = this.currentBlobURL;
      document.body.classList.add('first-track-loaded')
      console.log("first blob should be ready");
      console.log("(checking in loadTarck function calling inside poayerInitialisation) playlist lenght is — " + playlist.length);
      debugger
      
      return this.loadTrack(this);
      
    }).then(blobURL => {
      this.nextBlobURL = blobURL;
    }).catch(error => {
      console.error("Error setting the source for the audio player:", error);
    });
    
    audioPlayer.addEventListener("ended", playAndLoadNextTrack);
    
  }
  
  loadTrack({ playlist, index }) {
    // This function calls function which sets correct interval. It changes index to 0 if interval changes,
    // or we should start from the beginning.
    // Then it loads new track to blob.
    console.log('ppp', playlist[index])
    return fetch(playlist[index])
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
  
  
  playAndLoadNextTrack() {
    // If there is a next track
    // updateState(playlist[currentTrackIndex]);
    console.log('playlist[currentTrackIndex] and signedURL is ' + this.playlist[this.currentTrackIndex])
    if (this.nextBlobURL) {
      // Revoke the blob URL of the track that just finished playing
      if (this.currentBlobURL) {
        URL.revokeObjectURL(this.currentBlobURL);
      }
      
      this.currentBlobURL = this.nextBlobURL;
      this.currentTrackIndex = this.nextTrackIndex;
      this.nextBlobURL = null;
      audioPlayer.src = this.currentBlobURL;
      audioPlayer.play();
      // console.log(playlist[currentTrackIndex]);
      this.nextTrackIndex++;
      //console.log("(checking in audioPlayer on end event) playlist lenght is — " + playlist.length);
      //console.log("(checking in audioPlayer on end event) currentTrackIndex (after ++ above) — " + currentTrackIndex);
      
      this.currentIntervalData = getCurrentInterval(this.currentDayPlaylist);
      
      if (this.currentIntervalIndex !== this.currentIntervalData.index) {
        this.currentIntervalIndex = this.currentIntervalData.index;
        this.playlist = this.currentIntervalData.urls;
        this.nextTrackIndex = 0; // Start from the first track in the new interval
      } else if (this.nextTrackIndex >= this.playlist.length) {
        // If we're beyond the end of the current playlist, loop back to the start
        this.nextTrackIndex = 0;
      }
      
      this.loadTrack(this).then(blobURL => {
        this.nextBlobURL = blobURL;
      });
      
    }
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
    
    return currentInterval
    
  }
  
  getCurrentIntervalRelatedData(currentInterval) {
    if (currentInterval) {
      return { urls: interval.signedURLs, index: i };
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
  
  initializePlayerHTMLControls() {
    const audioPlayer = this.audioPlayer

    // player 'play' settings and event handlers
    const playButton = document.getElementById('play-button');
    const skipButton = document.getElementById('skip-button');
  
    skipButton.addEventListener('click', this.playAndLoadNextTrack());
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
  }
  
}
