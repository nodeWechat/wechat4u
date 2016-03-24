'use strict'

const axios = require('axios')
const CM = require('cookie-manager')
const paramsSerializer = (params) => {
  let qs = []
  for (let key in params)
    qs.push(`${key}=${params[key]}`)
  return encodeURI(qs.join('&'))
}

module.exports = function(defaults) {
  defaults = defaults || {}
  defaults.headers = defaults.headers || {}
  defaults.headers['user-agent'] = defaults.headers['user-agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'
  defaults.paramsSerializer = defaults.paramsSerializer || paramsSerializer
  this.axios = axios.create(defaults)
  if (typeof window == 'undefined') {
    this.cm = new CM()
    this.axios.interceptors.request.use(config => {
      config.headers['cookie'] = decodeURIComponent(this.cm.prepare(config.url))
      return config
    }, err => {
      return Promise.reject(err)
    })
    this.axios.interceptors.response.use(res => {
      let setCookie = res.headers['set-cookie']
      if (setCookie)
        this.cm.store(res.config.url, setCookie)
      return res
    }, err => {
      return Promise.reject(err)
    })
  }
  this.request = (options) => {
    return this.axios.request(options)
  }
  return this.request
}
