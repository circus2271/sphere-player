import fetchRetry from 'fetch-retry'
import { playerState } from './_playerState';
import { playlist } from './_playlist';

const fetchWithRetry = fetchRetry(fetch);

// a = 0
export const loadTrack = ({ tracks, trackIndex, returnOnlyBlob }) => {
// debugger
    // it may happen that user has switched a playlist when a track was retrying to load.
    // so, reset this id when user is switching a playlist.
    // that way a possible retrying will be canceled
    // ...
    // ... currently a function called "resetRepeatId" is used for this purpose
    const localRepeatId = new Date().getTime();
    playerState.globalRepeatId = localRepeatId

    let networkErrorsCounter = 0

    // console.log(tracks.length)
    // console.log(++a)
    // t = tracks[trackIndex]
    // debugger
    // if (trackIndex >= tracks.length) {
    //     return
    // }
    const trackUrl = tracks[trackIndex].url
    return fetchWithRetry(trackUrl, {
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

            if (localRepeatId !== playerState.globalRepeatId) {
                console.log('reset counter')
                console.log('cancel this track loading')
                return false;
            }

            if (error !== null || response.status >= 500 ) {
                if (error !== null) {
                    const isOnline = navigator.onLine

                    if (isOnline) {
                        networkErrorsCounter++
                    }

                    if (attempt === 2) {
                        if (networkErrorsCounter === 3) {
                            // if 3 network errors in a row, and it's not because the user is offline
                            // so it's probably an error due to blocked in rf hosting
                            // so, try to switch a domain to a fallback one

                            playlist.changeTracksDomain()
                            return false
                        }

                        return false
                    }
                }

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
            // return response.blob();

            // specify blob type to hopefully avoid safari bug
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });

            return blob
        })
        .then(blob => {
            if (returnOnlyBlob) {
                return blob
            }

            if (blob.size > 0) {
                console.log('Successfully fetched and have content in blob.');
                return URL.createObjectURL(blob);
            } else {
                console.warn('Fetch was successful but blob is empty.');

                // maybe return null
                // return null
            }
        })
}