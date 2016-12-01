'use strict'

const fetch = require('isomorphic-fetch')
const CM = require('cookie-manager')

module.exports = function(defaults) {
	this.defaults = defaults || {}
	this.cm = new CM()
	this.fetch = (url, options) => {
		options = options || {}
		options.headers = options.headers || {}
		options.headers.cookie = options.headers.cookie || decodeURIComponent(this.cm.prepare(url))
		for (let key in this.defaults) {
			if (key == 'headers') {
				for (let key in this.defaults.headers) {
					options.headers[key] = options.headers[key] || this.defaults.headers[key]
				}
			} else {
				options[key] = options[key] || this.defaults[key]
			}
		}
		if (!options.credentials) {
			delete options.headers.cookie
		}
		return fetch(url, options)
			.then(res => {
				let setCookie = res.headers.getAll('set-cookie')
				if (setCookie)
					this.cm.store(res.url, setCookie)
				return res
			})
	}
	return this.fetch
}
