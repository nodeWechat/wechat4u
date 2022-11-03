'use strict'
import Assert from 'assert'
import _debug from 'debug'
const debug = _debug('util')

export const isStandardBrowserEnv = (
  typeof window !== 'undefined' &&
  typeof document !== 'undefined' &&
  typeof document.createElement === 'function'
)

export const isFunction = val => Object.prototype.toString.call(val) === '[object Function]'

export function convertEmoji (s) {
  return s ? s.replace(/<span.*?class="emoji emoji(.*?)"><\/span>/g, (a, b) => {
    switch (b.toLowerCase()) {
      case '1f639':
        b = '1f602'
        break
      case '1f64d':
        b = '1f614'
        break
    }
    try {
      let s = null
      if (b.length === 4 || b.length === 5) {
        s = ['0x' + b]
      } else if (b.length === 8) {
        s = ['0x' + b.slice(0, 4), '0x' + b.slice(4, 8)]
      } else if (b.length === 10) {
        s = ['0x' + b.slice(0, 5), '0x' + b.slice(5, 10)]
      } else {
        throw new Error('unknown emoji characters')
      }
      return String.fromCodePoint.apply(null, s)
    } catch (err) {
      debug(b, err)
      return '*'
    }
  }) : ''
}

export function formatNum (num, length) {
  num = (isNaN(num) ? 0 : num).toString()
  let n = length - num.length

  return n > 0 ? [new Array(n + 1).join('0'), num].join('') : num
}

export const assert = {
  equal (actual, expected, response) {
    try {
      Assert.equal(actual, expected)
    } catch (e) {
      debug(e)
      delete response.request
      e.response = response
      throw e
    }
  },
  notEqual (actual, expected, response) {
    try {
      Assert.notEqual(actual, expected)
    } catch (e) {
      debug(e)
      delete response.request
      e.response = response
      throw e
    }
  },
  ok (actual, response) {
    try {
      Assert.ok(actual)
    } catch (e) {
      debug(e)
      delete response.request
      e.response = response
      throw e
    }
  }
}

export function getClientMsgId () {
  return Math.ceil(Date.now()* 1e3)
}

export function getDeviceID () {
  return 'e' + ('' + Math.random().toFixed(15)).substring(2, 17)
}
