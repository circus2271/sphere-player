import { fetchPlaylist, isObject, setPlayerTitle } from '../../utils/_helpers';
import IntervalManager from './_intervalManager';

class Playlist {
    currentPlaylistInitialData = null
    currentPlaylistTableId = null;
    currentPlaylistTableName = null;
    tracks = []
    isDomainReplaced = false
    #allTracks = null; // this value is deferred from player
    activeInterval = null

    constructor({allTracks, baseId, markPlaylistAsEnded}) {
        this.markPlaylistAsEnded = markPlaylistAsEnded

        this.#allTracks = allTracks
        this.baseId = baseId

        if (!this.baseId) {
            throw new Error('baseId should be provided')
        }

        if (!isObject(this.#allTracks)) {
            throw new Error('this.#allTracks should be an object')
        }
    }


    // setTracksFromCurrentInterval() {
    //     this.tracks = this.intervalManager.currentInterval.tracks
    // }

    async setPlaylistData({ newPlaylist, baseId }) {
    //     debugger
        // reset this value
        this.isDomainReplaced = false
        // show user friendly message
        setPlayerTitle('loading playlist...')

        this.currentPlaylistTableId = newPlaylist.tableId
        this.currentPlaylistTableName = newPlaylist.playlistName
        this.currentPlaylistInitialData = await fetchPlaylist(this.baseId, this.currentPlaylistTableId)
        // debugger

        this.intervalManager = new IntervalManager(this.currentPlaylistInitialData)
        this.intervalManager.prepareIntervals()

        this.changeInterval()
    }

    // change or set in this case are the same
    changeInterval() {

        const {tracks, index, time} = this.intervalManager.currentInterval

        if (index === -1) {
            console.warn('no available interval')
            console.warn('playlist is marked as ended')

            this.markPlaylistAsEnded()

            return
        }

        this.tracks = tracks
        this.activeInterval = time

        this.tracks.forEach(track => {
            this.#allTracks[track.id] = track.url
        })
    }

    getTrackId(index) {
        const track = this.tracks.find((track, i) => i === index)

        return track ? track.id : null
    }

    changeTracksDomain() {
        if (this.isDomainReplaced) return

        // const hostingDomain = 'https://spheresounds.cc'
        const hostingDomain = 'https://papervpn.io'
        const proxyDomain = 'https://d5d0b9cabj7ttci8bakd.k1mxzkh0.apigw.yandexcloud.net'

        const changeUrl = (track) => {
            const initialUrl = track.url
            const newUrl = initialUrl.replace(hostingDomain, proxyDomain)

            track.url = newUrl
        }

        this.intervalManager.changeTracksDomain(track => changeUrl(track))
        this.tracks.forEach(track => changeUrl(track))

        this.isDomainReplaced = true
    }

    removeTrack(id) {
        this.tracks = this.tracks.filter(track => track.id !== id)
    }
}


export default Playlist
