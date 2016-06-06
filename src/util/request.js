import axios from 'axios'
import CM from 'cookie-manager'
import {PassThrough as Pass} from 'stream'
import {isBrowser, isFunction} from './methods'

const paramsSerializer = params => {
  let qs = []
  for (let key in params) {
    qs.push(`${key}=${params[key]}`)
  }
  return encodeURI(qs.join('&'))
}

export function Request (defaults) {
  defaults = defaults || {}
  defaults.headers = defaults.headers || {}
  if (!isBrowser) {
    defaults.headers['user-agent'] = defaults.headers['user-agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'
  }
  defaults.paramsSerializer = defaults.paramsSerializer || paramsSerializer

  this.axios = axios.create(defaults)
  if (!isBrowser) {
    this.cm = new CM()
    this.axios.interceptors.request.use(config => {
      config.headers['cookie'] = config.url ? decodeURIComponent(this.cm.prepare(config.url)) : ''
      return config
    }, err => {
      return Promise.reject(err)
    })
    this.axios.interceptors.response.use(res => {
      let setCookie = res.headers['set-cookie']
      if (setCookie) {
        this.cm.store(res.config.url, setCookie)
      }
      return res
    }, err => {
      return Promise.reject(err)
    })
  }

  this.request = options => {
    return new Promise((resolve, reject) => {
      if (options.data && isFunction(options.data.pipe)) {
        let pass = new Pass()
        let buf = []
        if (isFunction(options.data.getHeaders)) {
          options.headers = options.data.getHeaders(options.headers)
        }
        pass.on('data', chunk => {
          buf.push(chunk)
        })
        pass.on('end', () => {
          let arr = new Uint8Array(Buffer.concat(buf))
          options.data = arr.buffer
          resolve(options)
        })
        pass.on('error', err => {
          reject(err)
        })
        options.data.pipe(pass)
      } else {
        resolve(options)
      }
    }).then(options => {
      return this.axios.request(options)
    })
  }

  return this.request
}
