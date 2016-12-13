import axios from 'axios'
import CM from 'cookie-manager'
import {isStandardBrowserEnv} from './global'

const getPgv = c => {
  return (c || '') + Math.round(2147483647 * (Math.random() || 0.5)) * (+new Date() % 1E10)
}

export function Request (defaults) {
  defaults = defaults || {}
  defaults.headers = defaults.headers || {}
  if (!isStandardBrowserEnv) {
    defaults.headers['user-agent'] = defaults.headers['user-agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'
    defaults.headers['connection'] = defaults.headers['connection'] || 'close'
  }

  defaults.httpAgent = false
  defaults.httpsAgent = false

  this.axios = axios.create(defaults)
  if (!isStandardBrowserEnv) {
    this.cm = new CM()
    this.cm.store('', ['pgv_pvi=' + getPgv() + '; Domain=.qq.com; Path=/', 'pgv_si=' + getPgv('s') + '; Domain=.qq.com; Path=/'])
    this.axios.interceptors.request.use(config => {
      config.headers['cookie'] = config.url ? decodeURIComponent(this.cm.prepare(config.url)) : ''
      return config
    }, err => {
      return Promise.reject(err)
    })
    this.axios.interceptors.response.use(res => {
      let setCookie = res.headers['set-cookie']
      if (setCookie) {
        this.cm.store(res.config.url, setCookie.map(item => {
          return item.replace(/=\s*?(?=(\w+\.)*(wx\d?\.qq\.com|wechat\.com))/, '=.')
        }))
      }
      return res
    }, err => {
      return Promise.reject(err)
    })
  }

  this.request = options => {
    return this.axios.request(options)
  }

  return this.request
}
