
class PlayerState {
    skipped = false
    playlistShouldChange = false
    globalRepeatId = null
    playlistEnded = false
    // currentInterval = null
    baseId = null;
    availablePlaylists = null;

    resetRepeatId() {
        this.globalRepeatId = null
    }
}

export const playerState = new PlayerState()