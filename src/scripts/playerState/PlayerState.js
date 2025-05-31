import {intervalManager} from "./playlist/_intervalManager";
import IntervalManager from "./playlist/_intervalManager";
// import {playlist} from "./playlist/_playlist";

import Playlist from "./playlist/Playlist";

class PlayerState {
    skipped = false
    playlistShouldChange = false
    globalRepeatId = null
    playlistEnded = false
    baseId = null;
    availablePlaylists = null;
    playlist = null
    allTracks = {}


    constructor({availablePlaylists, baseId}) {
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