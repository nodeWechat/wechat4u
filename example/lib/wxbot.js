"use strict"
const Wechat = require('../../index')
const debug = require('debug')('wxbot')

class WxBot extends Wechat {

  constructor() {
    super()

    this.replyUsers = new Set()
    this.on('text-message', msg => this._botReply(msg))

    this.superviseUsers = new Set()
    this.openTimes = 0
    this.on('mobile-open', () => this._botSupervise())
  }

  _tuning(word) {
    let params = {
      'key': '2ba083ae9f0016664dfb7ed80ba4ffa0',
      'info': word
    }
    return this.axios({
      method: 'GET',
      url: 'http://www.tuling123.com/openapi/api',
      params: params
    }).then(res => {
      const data = res.data
      if (data.code == 100000) {
        return data.text + '[微信机器人]'
      }      throw new Error("tuning返回值code错误", data)
    }).catch(err => {
      debug(err)
      return "现在思路很乱，最好联系下我哥 T_T..."
    })
  }

  _botReply(msg) {
    debug('自动回复')
    if (this.replyUsers.has(msg['FromUserName'])) {
      this._tuning(msg['Content']).then((reply) => {
        this.sendMsg(reply, msg['FromUserName'])
        debug(reply)
      })
    }
  }

  _botSupervise() {
    debug('自动监督', this.superviseUsers)
    const message = '我的主人玩微信' + ++this.openTimes + '次啦！'
    for (let user of this.superviseUsers.values()) {
      debug(user)
      this.sendMsg(message, user)
    }
  }

}

exports = module.exports = WxBot
