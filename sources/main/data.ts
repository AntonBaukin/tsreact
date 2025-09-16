import makeAppDataSources from 'sources/main/api/data'
import fetcher from './fetcher'

const {
  personsSource,
} = makeAppDataSources(fetcher)

export {
  personsSource,
}
