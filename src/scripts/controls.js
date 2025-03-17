import { likeDislikeService } from './likeDislikeService';
import { playerState } from './_playerState';
import { intervalManager } from './_intervalManager';
import { REINITIALIZE_APP_EVENT } from './_helpers';
import { playlist } from './_playlist'


const playButton = document.getElementById('play-button');
const skipButton = document.getElementById('skip-button');
const allButtons = document.querySelector('button')

let player;
let audioPlayer;
let intervalId;


const fadeInOutDuration = 800; // 2000ms = 2 seconds
// set css custom variable for css animations
playButton.style.setProperty('--animation-duration', fadeInOutDuration + 'ms')


// event handlers are subscribed not via addEventListener but via onclick and onsubmit properties
// it's made to avoid complexity when reinitializing player (as it will be needed to call removeEventListeners)
export const initializePlayerHTMLControls = (playerInstance) => {
    // it's made to have this variables as a global variables
    // so functions above could have access to those variables (and you don't have to pass it to each function manually)
    player = playerInstance;
    audioPlayer = playerInstance.audioPlayer

    // clean up
    playerState.resetRepeatId()
    clearInterval(intervalId)
    intervalId = null;

    // player 'play' settings and event handlers

    // skipButton.addEventListener('click', () => {
    skipButton.onclick = () => {
        // ставим флаг skipped в значение true
        playerState.skipped = true

        // здесь должна происходить перемотка трэка в конец,
        // чтобы потом автоматически сработала функция в onend у плеера,
        // там и отправляем всю статистику и данные
        // после отправки данных, возвращаем флаг в значение false (это уже в самом onend обработчике)
        audioPlayer.dispatchEvent(new Event('ended'))
    }
    // playButton.addEventListener('click', togglePlayPause);

    // let timerId;
    // let intervalId;
    playButton.onclick =  () => {
        // togglePlayPause()


        const hasCurrentInterval = intervalManager.hasCurrentInterval()
        // const paused = audioPlayer.paused || audioPlayer.ended
        // const playing = !paused
        const shouldStart = audioPlayer.paused || audioPlayer.ended
        const shouldPause = !shouldStart

        // const wasPaused = audioPlayer.paused || audioPlayer.ended

        if (shouldStart) {
            // attempt to start playing

            clearInterval(intervalId)


            if (!hasCurrentInterval) {
                playerState.playlistEnded = true

                console.warn('there is no current interval')
                // don't start a song, because there is no song and also no interval
                return
            }

            if (hasCurrentInterval) {
                // check if playlist was ended

                if (playerState.playlistEnded) {
                    // reset a player
                    // because it seems it was stopped, had no interval, and now it again has an interval

                    console.warn('attempting to restart a player')
                    window.dispatchEvent(new CustomEvent(REINITIALIZE_APP_EVENT))

                    return
                }

            }

            playButton.classList.add('playing');
            fadeAudioToPlaying();
        }

        if (shouldPause) {
            // user pressed pause button


            // playlist has a defined time of playing
            // it may happen that user stopped a playlist manually, and the time for a playing ended.
            // So, if user tries to resume a playlist in the morning, we need to check if a playlist was played yesterday
            // If so, we'll try to update and restart a player
            intervalId = setInterval(() => {

                playerState.playlistEnded = intervalManager.hasCurrentInterval()
                if (playerState.playlistEnded) {
                    clearInterval(intervalId)
                }
            }, 1000 * 60) // check every minute

            playButton.classList.remove('playing');
            fadeAudioToPause();
        }

        temporaryDisableAllButtons()
    }

    // if playlist button is clicked
    // change playlist and load first two tracks of it
    // document.querySelector('#playlists').addEventListener('click', async (event) => {
    // const playlistsHTMLNode = document.querySelector('#playlists')
    // playlistsHTMLNode.onclick = async (event) => {
    document.querySelector('#playlists').onclick = async (event) => {

        // playlist button is clicked
        if (event.target.closest('.playlist')) {
            const playlistButton = event.target.closest('.playlist');
            // const playlistName = playlistButton.dataset.playlistName

            if (playlistButton.classList.contains('playlist--selected')) {
                console.log('playlist already selected');
                return;
            }
            playerState.resetRepeatId()


            document.querySelector('.playlist--selected').classList.remove('playlist--selected')
            playlistButton.classList.add('playlist--selected')

            const newPlaylistName = playlistButton.dataset.playlistName
            const newPlaylist = player.availablePlaylists.find(playlist => playlist.playlistName === newPlaylistName)

            fadeOutPlayingState()
            // disable all buttons until first track is ready
            disableAllButtons()

            // end current track, so statistics and 'like'/'dislike' could be sent
            playerState.skipped = true
            playerState.playlistShouldChange = true
            audioPlayer.dispatchEvent(new Event('ended'))


            await playlist.setPlaylistData({ newPlaylist })
            // cancel loadtrack repeating if playlist has changed
            // resetRepeatId()
            // new playlist is set
            // make sure data is updated

            try {
                await player.initializeFirstTwoTracksOfAPlaylist({
                    firstTrackLoaded: () => {
                        enableAllButtons({exception: 'skip-button'})
                    }
                })
            } catch (error) {
                console.error(`playlist error: can't load first two tracks of a new playlist`)
            }
        }
    }

    const form = document.querySelector('#like-dislike-form')
    // form.addEventListener('submit', e => {
    form.onsubmit = e => {
        e.preventDefault()

        const submitter = e.submitter
        const like = submitter.id === 'like-button'
        const dislike = submitter.id === 'dislike-button'


        likeDislikeService.toggleScheduled({like, dislike})
    }

    // finally, enable all buttons
    enableAllButtons({exception: 'skip-button'})
}



// those are additional helper functions

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
function  enableAllButtons({exception} = {}) {
    allButtons.forEach(button => {
        // if (exception && button.id === exception) return
        button.disabled = false
    })
}

function disableAllButtons() {
    allButtons.forEach(button => {
        button.disabled = true
    })
}

// player audio controls
// function togglePlayPause() {
//     if (audioPlayer.paused || audioPlayer.ended) {
//         playButton.classList.add('playing');
//         fadeAudioToPlaying();
//     } else {
//         playButton.classList.remove('playing');
//         fadeAudioToPause();
//     }
//
//     temporaryDisableAllButtons()
// }

function temporaryDisableButton(button) {
    button.setAttribute('disabled', '')
    setTimeout(() => {
        button.removeAttribute('disabled')
    }, fadeInOutDuration)
}

function temporaryDisableAllButtons() {
    allButtons.forEach(button => {
        temporaryDisableButton(button)
    })
}

function fadeOutPlayingState() {
    playButton.classList.remove('playing')
    fadeAudioToPause()
}
