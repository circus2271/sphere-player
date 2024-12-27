let basePath = 'https://europe-central2-sphere-385104.cloudfunctions.net'

// export const changeBasePath = (url) = basePath = url
// it may happend that google url will be banned, so in this case use cloudflare proxy
// export const enableProxy = () => basePath = 'proxy path ...'
export const enableProxy =  () => basePath = 'https://my-first-worker.hi-c5b.workers.dev'
  // basePath = 'https://my-first-worker.hi-c5b.workers.dev'

export const loginApiEndpoint = () => `${basePath}/login`
// export const getRecordsApiEndpoint = `${basePath}/getRecords`
export const getRecordsApiEndpoint = () => `${basePath}/getRecordsFromCdn` // info + tracks
// export const getCdnRecordsApiEndpoint = `${basePath}/getRecordsFromCdn`
// export const getRecordsApiEndpoint = `${basePath}/getRecords-signedURL`
export const updateRecordApiEndpoint = () => `${basePath}/updateRecordStatus`
export const updateSongStatsApiEndpoint = () => `${basePath}/updateSongStats`


