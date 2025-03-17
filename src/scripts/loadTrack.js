import fetchRetry from 'fetch-retry'
import { playerState } from './_playerState';
import { playlist } from './_playlist';

const fetchWithRetry = fetchRetry(fetch);


export const loadTrack = ({ tracks, trackIndex, returnOnlyBlob }) => {

    // it may happen that user has switched a playlist when a track was retrying to load.
    // so, reset this id when user is switching a playlist.
    // that way a possible retrying will be canceled
    // ...
    // ... currently a function called "resetRepeatId" is used for this purpose
    const localRepeatId = new Date().getTime();
    playerState.globalRepeatId = localRepeatId

    console.log('ppp', tracks[trackIndex])
    return fetchWithRetry(tracks[trackIndex], {
        retryDelay: 1000,
        // retryDelay: 0,
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

            if (localRepeatId !== playerState.globalRepeatId) {
                console.log('reset counter')
                console.log('cancel this track loading')
                return false;
            }

            if (error !== null || response.status >= 500 ) {
                if (error !== null && !hostingWasChanged) {
                    // debugger
                    // alert(attempt)
                    if (attempt === 2) {
                        self.updatePlaylistData(self.currentPlaylistInitialData, true)
                        // playlist.replaceTracksDomainIfNeeded()
                        playlist.replaceTracksDomain()
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