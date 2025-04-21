import { randomize } from './_helpers';
import { playlist } from './_playlist'

class IntervalManager {
    #preparedIntervals = null
    // selectedIntervalIndex = -1;

    hasCurrentInterval() {
        return !!this.currentInterval
    }

    // an object with a structure like follows:
    // {time: '8-12', tracks: [{id: 'fdf', url: 'https://example.com'}]}
    get currentInterval() {
        // This function aims to find the current time interval (based on the hour of the day) from a given list of intervals,
        // and return the associated URLs and the index of the interval within the provided list.

        const currentHour = new Date().getHours(); // Get the current hour (0 - 23)

        // const currentInterval = this.intervals.find((interval, i) => {
        const currentInterval = this.#preparedIntervals.find((interval, i) => {
            const [start, end] = interval.time.split('-').map(Number); // Convert "12-15" to [12, 15]

            // Adjust for times wrapping midnight, e.g., "23-2"
            if (start > end) {
                return currentHour >= start || currentHour < end
            } else {
                return currentHour >= start && currentHour < end
            }
        })

        // return interval and set currentIntervalIndex
        // it's needed to decided if it's needed to change interval (later in code
        if (currentInterval) {
            // this.selectedIntervalIndex = currentInterval.index
            return currentInterval
        }

        const fallbackInterval = {
            tracks: null,
            index: -1
        }

        // this.selectedIntervalIndex = fallbackInterval.index

        return fallbackInterval
    }


    prepareIntervals() {
        this.#preparedIntervals = this.#intervals
    }

    changeTracksDomain(callback) {
        this.#preparedIntervals.forEach(interval => {
            interval.tracks.forEach(track => {
                callback(track)
            })
        })
    }

    // returns array of objects
    // for example: [{time: '8-12', tracks: [{id: 'fdf', url: 'https://example.com'}]}]
    get #intervals() {
        // const { initialPlaylistData } = playlist
        const { currentPlaylistInitialData: initialPlaylistData } = playlist
        // THIS function works (getting as an argument) the whole playlist with all the days intervals
        // IT RETURNS the array with intervals for a particular day. The result of interval sets is time-sorted

        // Get the current day
        const currentDate = new Date();
        const currentDay = currentDate.toLocaleString('en-US', { weekday: 'long' });

        // Define an object to store intervals and their respective songs
        const songIntervals = {};

        initialPlaylistData.forEach(song => {
            // Check if the song has an interval for the current day
            const interval = song.fields[currentDay];
            if (interval) {
                // Check if we already have this interval in the songIntervals object
                if (!songIntervals[interval]) {
                    songIntervals[interval] = [];
                }
                // Add the song's signedUrl to the interval array
                // songIntervals[interval].push(song.signedUrl);
                const songUrl = song.fields['Full link']
                const songId = song.id

                songIntervals[interval].push({url: songUrl, id: songId});
            }
        });

        const keys = Object.keys(songIntervals)
        const sortedKeys = [...keys].sort((a, b) => {
            const [startA, endA] = a.split('-').map(Number);
            const [startB, endB] = b.split('-').map(Number);

            // Handle cases where interval wraps around midnight
            if (startA > endA && (startB <= endB || startA < startB)) return 1;
            if (startB > endB && (startA <= endA || startB < startA)) return -1;

            return startA - startB;
        });


        const intervals = sortedKeys.map((time, index) => ({
            time,
            // encodedURLs: randomize(songIntervals[time])
            tracks: randomize(songIntervals[time]),
            index
        }))

        return intervals
    }
}

export const intervalManager = new IntervalManager()