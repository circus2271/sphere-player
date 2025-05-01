import { fetchPlaylist, setPlayerTitle, updateHostingStats } from '../utils/_helpers';
import { intervalManager } from './_intervalManager';
// import { playerState } from './_playerState';

class Playlist {
    currentPlaylistInitialData = null
    currentPlaylistTableId = null;
    currentPlaylistTableName = null;
    tracks = []
    isDomainReplaced = false

    setTracksFromCurrentInterval() {
        this.tracks = intervalManager.currentInterval.tracks
    }

    async setPlaylistData({ newPlaylist, baseId }) {
        // reset this value
        this.isDomainReplaced = false
        // show user friendly message
        setPlayerTitle('loading playlist...')

        this.currentPlaylistTableId = newPlaylist.tableId
        this.currentPlaylistTableName = newPlaylist.playlistName
        // this.currentPlaylistInitialData = await fetchPlaylist(playerState.baseId, this.currentPlaylistTableId)
        this.currentPlaylistInitialData = await fetchPlaylist(baseId, this.currentPlaylistTableId)

        intervalManager.prepareIntervals()
        this.tracks = intervalManager.currentInterval.tracks
    }

    getTrackById(id) {
        return this.tracks.find(track => track.id === id)
    }

    getTrackByIndex(index) {
        return this.tracks.find((track, i) => i === index)
    }

    getTrackId(index) {
        const track = this.tracks.find((track, i) => i === index)

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

        intervalManager.changeTracksDomain(track => changeUrl(track))
        this.tracks.forEach(track => changeUrl(track))

        this.isDomainReplaced = true
        updateHostingStats({playlistName: playlist.currentPlaylistTableName})
    }

    removeTrack(id) {
        this.tracks = this.tracks.filter(track => track.id !== id)
    }
}

export const playlist = new Playlist()