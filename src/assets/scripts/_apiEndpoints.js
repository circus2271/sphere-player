let basePath = 'https://europe-central2-sphere-385104.cloudfunctions.net'

// it may happen that google url will be banned, so in this case use cloudflare proxy
export const enableProxy =  async () => {
  return new Promise(resolve => {
    // this hack is used to make sure the link is updated
    setTimeout(() => {
      basePath = 'https://my-first-worker.hi-c5b.workers.dev'
      resolve()
    }, 0)
  })
}

// use those functions as a getter
// bacause basePath may be changed
export const loginApiEndpoint = () => `${basePath}/login`
export const getRecordsApiEndpoint = () => `${basePath}/getRecordsFromCdn` // info + tracks
export const updateRecordApiEndpoint = () => `${basePath}/updateRecordStatus`
export const updateSongStatsApiEndpoint = () => `${basePath}/updateSongStats`


