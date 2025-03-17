import { fetchPlaylist, setPlayerTitle, updateHostingStats } from './_helpers';
import { intervalManager } from './_intervalManager';
import { playerState } from './_playerState';

class Playlist {
    currentPlaylistInitialData = null
    currentDayPlaylist = null;
    currentPlaylistTableId = null;
    currentPlaylistTableName = null;
    tracks = []
    isDomainReplaced = false

    setTracksFromCurrentInterval() {
        this.tracks = intervalManager.currentInterval.urls

        this.replaceTracksDomain()
    }

    async setPlaylistData({ newPlaylist }) {
        this.isDomainReplaced = false
        // show user friendly message
        setPlayerTitle('loading playlist...')

        this.currentPlaylistTableId = newPlaylist.tableId
        this.currentPlaylistTableName = newPlaylist.playlistName
        this.currentPlaylistInitialData = await fetchPlaylist(playerState.baseId, this.currentPlaylistTableId)

        const currentIntervalData = intervalManager.currentInterval
        intervalManager.updateCurrentIntervalData(currentIntervalData)

        this.tracks = intervalManager.currentIntervalData.urls;

    }

    replaceTracksDomain() {
        if (this.isDomainReplaced) return

        const hostingDomain = 'https://spheresounds.cc'
        const proxyDomain = 'https://d5d0b9cabj7ttci8bakd.k1mxzkh0.apigw.yandexcloud.net'

        this.tracks.forEach(track => {
            const link = track.fields['Full link']

            const newLink = link.replace(hostingDomain, proxyDomain)

            track.fields['Full link'] = newLink
        })

        this.isDomainReplaced = true
        updateHostingStats({playlistName: playlist.currentPlaylistTableName})
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

    removeTrack(id) {
        this.tracks = this.tracks.filter(track => track.id !== id)
    }
}

export const playlist = new Playlist()