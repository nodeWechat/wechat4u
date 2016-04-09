'use strict'
const Wechat = require('../../index')
const debug = require('debug')('wxbot')
const fs = require('fs')
const ffmpeg = require('ffmpeg')

class WxBot extends Wechat {

  constructor() {
    super()

    this.memberInfoList = []

    this.replyUsers = new Set()
    this.on('text-message', msg => this._botReply(msg))
    this.on('voice-message', msg => this._botReply(msg))
    this.on('image-message', msg => this._botReply(msg))
 
    this.superviseUsers = new Set()
    this.openTimes = 0
    this.on('init-message', () => this._botSupervise())
  }

  get replyUsersList() {
    let members = []

    this.groupList.forEach(member => {
      members.push({
        username: member['UserName'],
        nickname: '群聊: ' + member['NickName'],
        py: member['RemarkPYQuanPin'] ? member['RemarkPYQuanPin'] : member['PYQuanPin'],
        switch: this.replyUsers.has(member['UserName'])
      })
    })

    this.contactList.forEach(member => {
      members.push({
        username: member['UserName'],
        nickname: member['RemarkName'] ? member['RemarkName'] : member['NickName'],
        py: member['RemarkPYQuanPin'] ? member['RemarkPYQuanPin'] : member['PYQuanPin'],
        switch: this.replyUsers.has(member['UserName'])
      })
    })

    return members
  }

  get superviseUsersList() {
    let members = []

    this.groupList.forEach(member => {
      members.push({
        username: member['UserName'],
        nickname: '群聊: ' + member['NickName'],
        switch: this.superviseUsers.has(member['UserName'])
      })
    })

    this.contactList.forEach(member => {
      members.push({
        username: member['UserName'],
        nickname: member['RemarkName'] ? member['RemarkName'] : member['NickName'],
        switch: this.superviseUsers.has(member['UserName'])
      })
    })

    return members
  }

  _tuning(word) {
    let params = {
      'key': '2ba083ae9f0016664dfb7ed80ba4ffa0',
      'info': word
    }
    return this.request({
      method: 'GET',
      url: 'http://www.tuling123.com/openapi/api',
      params: params
    }).then(res => {
      const data = res.data
      if (data.code == 100000) {
        return data.text + '[微信机器人]'
      }
      throw new Error('tuning返回值code错误', data)
    }).catch(err => {
      debug(err)
      return '现在思路很乱，最好联系下我哥 T_T...'
    })
  }
  
  _getWavBuf(mp3Buf) {
    return new Promise((resolve, reject) => {
      fs.writeFile('1.mp3', mp3Buf, (err,file) => {
        if(err) {
          reject(err)
        }
        let process = new ffmpeg('1.mp3')
        process.then( (video) => {
          video.save('1.wav', () => {
            fs.readFile('1.wav', (err, buf) => {
              if(err) {
                reject(err)
              }
              fs.unlink('1.wav')
              fs.unlink('1.mp3')
              resolve(buf)
            })
          })
        }).catch(err => {
          reject(err)
        })
      })
    })
  }
  
  _speechRecognize(buf) {
    let params = {
      'cuid': 'wechat4u',
      'lan': 'zh',
      'token': '24.9a233a67c12f73276a026357b6079dc0.2592000.1462584892.282335-6332804'
    }
    return this.request({
      method: 'POST',
      url: 'http://vop.baidu.com/server_api',
      headers: {
        'Content-Type': 'audio/wav; rate=8000',
      },
      params: params,
      data: buf
    }).then(res => {
      const data = res.data
      debug('语音识别结果：', data.result[0])
      return data.result[0]
    })
  }

  _botReply(msg) {
    if (this.replyUsers.has(msg['FromUserName'])) {
      new Promise((resolve, reject) => {
        if(msg['Content'].type === 'audio/mp3') {
          this._getWavBuf(msg['Content'].data)
            .then(buf => this._speechRecognize(buf))
            .then(content => this._tuning(content))
            .then(replyContent => resolve(replyContent))
        } else if(msg['Content'].type === 'image/jpeg') {
          resolve('好美的照片啊！')
        } else {
          this._tuning(msg['Content'])
              .then(replyContent => resolve(replyContent))
        }
      }).then(replyContent => {
        this.sendMsg(replyContent, msg['FromUserName'])
        debug('回复消息：', replyContent)
      })
    }
  }

  _botSupervise() {
    const message = '我的主人玩微信' + ++this.openTimes + '次啦！'
    for (let user of this.superviseUsers.values()) {
      this.sendMsg(message, user)
      debug(message)
    }
  }

}

exports = module.exports = WxBot
