import axios from 'axios'
import config from 'sources/config'
import { expectString } from 'sources/asserts'
import { axiosFetcher } from 'sources/fetch'

const apiUrl = expectString(config.servers.api)

const apiFetcher = axiosFetcher(
  axios.create({
    baseURL: apiUrl,
    timeout: 4000,
  }),
)

// TODO Wrap apiFetcher instance with QoS fallbacks
export default apiFetcher
