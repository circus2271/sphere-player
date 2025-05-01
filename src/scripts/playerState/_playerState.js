import {intervalManager} from "./_intervalManager";
import {playlist} from "./_playlist";

class PlayerState {
    skipped = false
    playlistShouldChange = false
    globalRepeatId = null
    playlistEnded = false
    // currentInterval = null
    baseId = null;
    availablePlaylists = null;
    playlist = playlist
    intervalManager = intervalManager

    resetRepeatId() {
        this.globalRepeatId = null
    }
}

export const playerState = new PlayerState()