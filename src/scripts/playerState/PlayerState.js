import Playlist from './playlist/Playlist';

const allTracks = {}

class PlayerState {
    // playlistShouldChange = false
    globalRepeatId = null
    playlistEnded = false
    baseId = null;
    availablePlaylists = null;
    playlist = null


    constructor({availablePlaylists, baseId}) {
        this.allTracks = allTracks // this way it can be persistent across multiple PlayerState instances
        this.availablePlaylists = availablePlaylists
        this.baseId = baseId
        this.playlist = new Playlist({allTracks: this.allTracks, baseId: this.baseId})
    }

    resetRepeatId() {
        this.globalRepeatId = null
    }
}

// export const playerState = new playerState()
// export const playerState = new PlayerState()
// export const playerState = new PlayerState()
export default PlayerState