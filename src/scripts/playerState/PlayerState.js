import {intervalManager} from "./playlist/_intervalManager";
import IntervalManager from "./playlist/_intervalManager";
// import {playlist} from "./playlist/_playlist";

import Playlist from "./playlist/Playlist";

class PlayerState {
    skipped = false
    playlistShouldChange = false
    globalRepeatId = null
    playlistEnded = false
    // currentInterval = null
    baseId = null;
    availablePlaylists = null;
    // playlist = playlist
    playlist = null
    // intervalManager = intervalManager
    intervalManager = new IntervalManager()
    allTracks = []

    // constructor(playlist, intervalManager) {
    constructor() {
        this.playlist = new Playlist(this)


    }

    resetRepeatId() {
        this.globalRepeatId = null
    }
}

// export const playerState = new playerState()
// export const playerState = new PlayerState()
// export const playerState = new PlayerState()
export default PlayerState