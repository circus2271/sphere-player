const basePath = 'https://europe-central2-sphere-385104.cloudfunctions.net'

export const loginApiEndpoint = `${basePath}/login`

export const getRecordsApiEndpoint = `${basePath}/getRecordsFromCdn` // info + tracks

export const updateRecordApiEndpoint = `${basePath}/updateRecordStatus`
export const updateSongStatsApiEndpoint = `${basePath}/updateSongStats`

export const updateHostingStatsApiEndpoint = `${basePath}/updateHostingStats`