import { randomize } from './_helpers';
import { playlist } from './_playlist'

class IntervalManager {
    currentIntervalData = null;
    currentIntervalIndex = -1;

    updateCurrentIntervalData(intervalData) {
        this.currentIntervalData = intervalData
        this.currentIntervalIndex = intervalData.index // perhaps it's not needed to duplicate that
    }

    hasCurrentInterval() {
        return !!this.currentInterval
    }

    get currentInterval() {
        // This function aims to find the current time interval (based on the hour of the day) from a given list of intervals,
        // and return the associated URLs and the index of the interval within the provided list.
        const { preparedPlaylist } = playlist

        const currentHour = new Date().getHours(); // Get the current hour (0 - 23)

        const currentInterval = preparedPlaylist.find((interval, i) => {
            const [start, end] = interval.time.split('-').map(Number); // Convert "12-15" to [12, 15]

            // Adjust for times wrapping midnight, e.g., "23-2"
            if (start > end) {
                return currentHour >= start || currentHour < end
            } else {
                return currentHour >= start && currentHour < end
            }
        })


        if (currentInterval) {
            const index = preparedPlaylist.findIndex(interval => interval.time === currentInterval.time)
            currentInterval.index = index

            return currentInterval
        }

        const fallbackInterval = {
            urls: null,
            index: -1
        }

        return fallbackInterval
    }


    // returns array of objects
    // for example: [{ time: "8-12", signedURLs: ["1.mp3", "2.mp3", "3.mp3"] }, {...} ]
    // getCurrentDaySongsInPlaylist(initialPlaylistData) {
    get intervals() {
        const { initialPlaylistData } = playlist
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
                songIntervals[interval].push(song.fields['Full link']);
            }
        });

        const keys = Object.keys(songIntervals)
        const sortedKeys = [...keys].sort((a, b) => {
            const [startA, endA] = a.time.split('-').map(Number);
            const [startB, endB] = b.time.split('-').map(Number);

            // Handle cases where interval wraps around midnight
            if (startA > endA && (startB <= endB || startA < startB)) return 1;
            if (startB > endB && (startA <= endA || startB < startA)) return -1;

            return startA - startB;
        });


        const intervals = sortedKeys.map(time => ({
            time,
            encodedURLs: randomize(songIntervals[time])
        }))

        return intervals
    }
}

export const intervalManager = new IntervalManager()