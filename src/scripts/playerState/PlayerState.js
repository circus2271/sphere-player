import Playlist from './playlist/Playlist';

const allTracks = {}

class PlayerState {
    globalRepeatId = null
    playlistEnded = false
    baseId = null;
    availablePlaylists = null;
    playlist = null


    constructor({availablePlaylists, baseId}) {
        this.allTracks = allTracks // this way it can be persistent across multiple PlayerState instances
        this.availablePlaylists = availablePlaylists
        this.baseId = baseId
        this.playlist = new Playlist({
            allTracks: this.allTracks,
            baseId: this.baseId,
            markPlaylistAsEnded: this.markPlaylistAsEnded
        })
    }

    resetRepeatId() {
        this.globalRepeatId = null
    }

    markPlaylistAsEnded() {
        this.playlistEnded = true
        console.log(this.playlistEnded)
    }
}

export default PlayerState