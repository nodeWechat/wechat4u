'use strict'

const axios = require('axios')
const CM = require('cookie-manager')

module.exports = {
  create(options) {
    return (() => {
      if (!options)
        options = {}
      if (!options.headers)
        options.headers = {}
      if (!options.headers['user-agent'])
        options.headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'
      if (!options.paramsSerializer) {
        options.paramsSerializer = (params) => {
          let qs = []
          for (let key in params)
            qs.push(`${key}=${params[key]}`)
          return encodeURI(qs.join('&'))
        }
      }
      let instance = axios.create(options)
      if (typeof window == "undefined") {
        let cm = new CM()
        instance.interceptors.request.use(config => {
          config.headers['cookie'] = decodeURIComponent(cm.prepare(config.url))
          return config
        }, err => {
          return Promise.reject(err)
        })
        instance.interceptors.response.use(res => {
          let cookies = res.headers['set-cookie']
          if (cookies)
            cm.store(res.config.url, cookies)
          return res
        }, err => {
          return Promise.reject(err)
        })
      }
      return (options) => {
        return instance.request(options)
      }
    })()
  }
}
