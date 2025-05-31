import {fetchPlaylist, isObject, setPlayerTitle, updateHostingStats} from '../../utils/_helpers';
// import { intervalManager } from './_intervalManager';
import IntervalManager from './_intervalManager';
import PlayerState from "../PlayerState";
// import { playerState } from './_playerState';

class Playlist {
    currentPlaylistInitialData = null
    currentPlaylistTableId = null;
    currentPlaylistTableName = null;
    tracks = []
    isDomainReplaced = false
    // playerState = new PlayerState()
    #allTracks = null; // this value is deferred from player

    constructor({allTracks, baseId}) {
        // this.intervalManager = new IntervalManager({currentPlaylistInitialData: this.currentPlaylistInitialData})

        this.#allTracks = allTracks
        // this.#allTracks = []
        this.baseId = baseId

        if (!this.baseId) {
            throw new Error('baseId should be provided')
        }

        if (!isObject(this.#allTracks)) {
            throw new Error('this.#allTracks should be an object')
        }
    }


    setTracksFromCurrentInterval() {
        this.tracks = this.intervalManager.currentInterval.tracks
    }

    async setPlaylistData({ newPlaylist, baseId }) {
        // reset this value
        this.isDomainReplaced = false
        // show user friendly message
        setPlayerTitle('loading playlist...')

        this.currentPlaylistTableId = newPlaylist.tableId
        this.currentPlaylistTableName = newPlaylist.playlistName
        // this.currentPlaylistInitialData = await fetchPlaylist(playerState.baseId, this.currentPlaylistTableId)
        this.currentPlaylistInitialData = await fetchPlaylist(this.baseId, this.currentPlaylistTableId)
        // debugger

        this.intervalManager = new IntervalManager(this.currentPlaylistInitialData)
        this.intervalManager.prepareIntervals()

        this.tracks = this.intervalManager.currentInterval.tracks


        // this.tracks.forEach(track => {
        //     this.player.allTracks[track.id] = track.url
        // })
        this.tracks.forEach(track => {
            this.#allTracks[track.id] = track.url
        })

        // this.playerState.allTracks.push(...this.tracks)
    }

    getTrackById(id) {
        return this.tracks.find(track => track.id === id)
        // return this.playerState.allTracks.find(track => track.id === id)
    }

    getTrackByIndex(index) {
        return this.tracks.find((track, i) => i === index)
    }

    getTrackId(index) {
        const track = this.tracks.find((track, i) => i === index)
        // const track = this.playerState.allTracks.find((track, i) => i === index)

        return track ? track.id : null
    }
    // getTrack(id) {
    //     return this.tracks.find(track => track.id === id)
    // }

    // removeTrackFromPlaylist(id) {
    //     this.tracks = this.tracks.filter(track => track.id !== id)
    // }

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
        // updateHostingStats({playlistName: playlist.currentPlaylistTableName})
        // updateHostingStats({playlistName: this.currentPlaylistTableName})
    }

    removeTrack(id) {
        this.tracks = this.tracks.filter(track => track.id !== id)
    }
}


export default Playlist
