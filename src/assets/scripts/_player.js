import howler from 'howler'

var currentPlaylist, currentDayPlaylist;

const firstLineActionsDiv = document.querySelector('.first-line-actions');
firstLineActionsDiv.style.opacity = '0.2';

const audioPlayer = document.getElementById('audioPlayer');
const playButton = document.getElementById('play-button');
playButton.addEventListener('click', togglePlayPause);
const fadeInOutDuration = 800; // 2000ms = 2 seconds

let currentInterval = null;
let currentTrackIndex = 0;
let playlist = null;

let currentIntervalIndex = -1;


function getCurrentDaySongsInPlaylist(playlistObj) {

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// THIS function works (getting as an argument) the whole playlist with all the days intervals
	// IT RETURNS the array with intervals for a particular day. The result of interval sets is time-sorted
	//////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Get the current day
    const currentDate = new Date();
    const currentDay = currentDate.toLocaleString('en-US', { weekday: 'long' });

    // Define an object to store intervals and their respective songs
    const songIntervals = {};

    // Iterate through the playlist (which is under the key "playlist" in the playlistObj)
    playlistObj.playlist.forEach(song => {
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

function shuffle(array) {

	////////////////////////////////////////////////////////////////////////////////////////////////
	// THIS function only shuffles array
	////////////////////////////////////////////////////////////////////////////////////////////////


    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    // Shuffles array which commes as an argument
    return array;
}

function getCurrentInterval(data) {

	////////////////////////////////////////////////////////////////////////////////////////////////
	// This function aims to find the current time interval (based on the hour of the day) from a given list of intervals,
	// and return the associated URLs and the index of the interval within the provided list.
	////////////////////////////////////////////////////////////////////////////////////////////////

	const currentHour = new Date().getHours(); // Get the current hour (0 - 23)

	  for (let i = 0; i < data.length; i++) {
	    const interval = data[i];
	    const [start, end] = interval.time.split('-').map(Number); // Convert "12-15" to [12, 15]

	    // Adjust for times wrapping midnight, e.g., "23-2"
	    if (start > end) {
	      if (currentHour >= start || currentHour < end) {
	      	currentIntervalIndex
	        return { urls: interval.signedURLs, index: i };
	      }
	    } else {
	      if (currentHour >= start && currentHour < end) {
	        return { urls: interval.signedURLs, index: i };
	      }
	    }
	  }
	  return { urls: [], index: -1 }; // Default return if no matching interval is found
}

function loadTrack(index) {

	////////////////////////////////////////////////////////////////////////////////////////////////
	// This function calls function which sets correct interval. It changes index to 0 if interval changes, 
	// or we should start from the begining.
	// Then it loads new track to blob.
	////////////////////////////////////////////////////////////////////////////////////////////////

  const currentIntervalData = getCurrentInterval(currentDayPlaylist);
  if (currentIntervalIndex !== currentIntervalData.index) {
    currentIntervalIndex = currentIntervalData.index;
    playlist = currentIntervalData.urls;
    currentTrackIndex = 0; // Start from the first track in the new interval
  } else if (index >= playlist.length) {
    // If we're beyond the end of the current playlist, loop back to the start
    currentTrackIndex = 0;
  }

	return fetch(playlist[currentTrackIndex])
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
    .catch(e => console.error(e));

}

function togglePlayPause() {
    if (audioPlayer.paused || audioPlayer.ended) {
        playButton.classList.add('playing');
        fadeAudioInPause();
    } else {
        playButton.classList.remove('playing');
        fadeAudioOutPause();
    }
}

function fadeAudioOutPause() {
    let volume = 1.0;
    
    const fadeInterval = setInterval(function() {
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
    
    const fadeInterval = setInterval(function() {
        volume += 0.05;  // increase by 0.05 until 1.0
        if (volume >= 1.0) {
            volume = 1.0;
            clearInterval(fadeInterval);
        }
        audioPlayer.volume = volume;
    }, fadeInOutDuration / 20);  // 20 intervals during the fade duration
}

function playerInitialisation (currentDayPlaylist) {


}


//console.log(howler)
export const handlePlayer = (playlists) => {
  console.log('hello from player')

  const firstPlaylist = playlists[0];
  currentPlaylist = firstPlaylist;
  currentDayPlaylist = getCurrentDaySongsInPlaylist(currentPlaylist);
  currentInterval = getCurrentInterval(currentDayPlaylist);

  loadTrack(currentTrackIndex).then(blobURL => {
    audioPlayer.src = blobURL;
    firstLineActionsDiv.style.opacity = '1';
    // If you want to start playing immediately after setting the source:
    // audioPlayer.play();
	}).catch(error => {
	    console.error("Error setting the source for the audio player:", error);
   });

  console.log('all the playlists of a place are', playlists)
  console.log('firstPlaylist is', firstPlaylist)
  console.log('currentDayPlaylist is ', currentDayPlaylist)
  console.log('currentInterval is ', currentInterval)
}





