"use strict"
const EventEmitter = require('events')
const fs = require('fs')
const request = require('./request.js')
const debug = require('debug')('wechat')
const FormData = require('form-data')
const mime = require('mime')
const Pass = require('stream').PassThrough
const updateAPI = require('./webwxapi.js')

// Private Method
const _convertEmoji = (s) => {
  return s.replace(/<span.*?class="emoji emoji(.*?)"><\/span>/g, (a, b) => {
    try {
      let s = null
      if (b.length == 4 || b.length == 5) {
        s = ['0x' + b]
      } else if (b.length == 8) {
        s = ['0x' + b.slice(0, 4), '0x' + b.slice(4, 8)]
      } else if (b.length == 10) {
        s = ['0x' + b.slice(0, 5), '0x' + b.slice(5, 10)]
      } else {
        throw new Error('unknown emoji characters')
      }
      return String.fromCodePoint.apply(null, s)
    } catch (err) {
      debug(b, err)
      return ' '
    }
  })
}
const _contentPrase = (s) => _convertEmoji(s.replace('&lt;', '<').replace('&gt;', '>').replce('<br/>', '\n'))

// Private
const PROP = Symbol()
const API = Symbol()
const SPECIALUSERS = ['newsapp', 'fmessage', 'filehelper', 'weibo', 'qqmail', 'fmessage', 'tmessage', 'qmessage', 'qqsync', 'floatbottle', 'lbsapp', 'shakeapp', 'medianote', 'qqfriend', 'readerapp', 'blogapp', 'facebookapp', 'masssendapp', 'meishiapp', 'feedsapp', 'voip', 'blogappweixin', 'weixin', 'brandsessionholder', 'weixinreminder', 'wxid_novlwrv3lqwv11', 'gh_22b87fa7cb3c', 'officialaccounts', 'notification_messages', 'wxid_novlwrv3lqwv11', 'gh_22b87fa7cb3c', 'wxitil', 'userexperience_alarm', 'notification_messages']
const STATE = {
  init: 'init',
  uuid: 'uuid',
  login: 'login',
  logout: 'logout'
}

class Wechat extends EventEmitter {

  constructor() {
    super()
    this[PROP] = {
      uuid: '',
      uin: '',
      sid: '',
      skey: '',
      passTicket: '',
      formateSyncKey: '',
      webwx_data_ticket: '',
      deviceId: 'e' + Math.random().toString().substring(2, 17),

      baseRequest: {},
      syncKey: {},
    }

    this[API] = {
      jsLogin: "https://login.weixin.qq.com/jslogin",
      login: "https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login",
    }
    this.mediaSend = 0
    this.state = STATE.init

    this.user = []       // 登陆账号
    this.memberList = [] // 所有联系人

    this.contactList = [] // 个人联系人
    this.groupList = []   // 已保存群聊
    this.groupMemberList = [] // 所有群聊内联系人
    this.publicList = []  // 公众账号
    this.specialList = [] // 特殊账号

    this.request = new request()
  }

  setProp(key, val) {
    this[PROP][key] = val
  }

  getProp(key) {
    return this[PROP][key]
  }

  // 通讯录好友
  get friendList() {
    let members = []

    this.groupList.forEach((member) => {
      members.push({
        username: member['UserName'],
        nickname: '群聊: ' + member['NickName'],
        py: member['RemarkPYQuanPin'] ? member['RemarkPYQuanPin'] : member['PYQuanPin'],
      })
    })

    this.contactList.forEach((member) => {
      members.push({
        username: member['UserName'],
        nickname: member['RemarkName'] ? member['RemarkName'] : member['NickName'],
        py: member['RemarkPYQuanPin'] ? member['RemarkPYQuanPin'] : member['PYQuanPin'],
      })
    })

    return members
  }

  getUUID() {
    let params = {
      'appid': 'wx782c26e4c19acffb',
      'fun': 'new',
      'lang': 'zh_CN'
    }
    return this.request({
      method: 'POST',
      url: this[API].jsLogin,
      params: params
    }).then(res => {
      let pm = res.data.match(/window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)"/)
      if (!pm) {
        throw new Error("UUID错误: 格式错误")
      }
      let code = pm[1]
      let uuid = this[PROP].uuid = pm[2]

      this.emit('uuid', uuid)
      this.state = STATE.uuid

      if (code != 200) {
        throw new Error("UUID错误: " + code)
      }

      return uuid
    }).catch(err => {
      debug(err)
      throw new Error('获取UUID失败')
    })
  }

  checkScan() {
    let params = {
      'tip': 1,
      'uuid': this[PROP].uuid,
    }
    return this.request({
      method: 'GET',
      url: this[API].login,
      params: params
    }).then(res => {
      let pm = res.data.match(/window.code=(\d+);/)
      let code = pm[1]

      if (code != 201) {
        throw new Error('扫描状态code错误: ' + code)
      }
    }).catch(err => {
      debug(err)
      throw new Error('获取扫描状态信息失败')
    })
  }

  checkLogin() {
    let params = {
      'tip': 0,
      'uuid': this[PROP].uuid,
    }
    return this.request({
      method: 'GET',
      url: this[API].login,
      params: params
    }).then(res => {
      let pm = res.data.match(/window.code=(\d+);/)
      let code = pm[1]

      if (code != 200) {
        throw new Error('登陆确认code错误: ' + code)
      }
      
      pm = res.data.match(/window.redirect_uri="(\S+?)";/)
      this[API].rediUri = pm[1] + '&fun=new'
      this[API].baseUri = this[API].rediUri.substring(0, this[API].rediUri.lastIndexOf("/"))

      // 接口更新
      updateAPI(this[API])
    }).catch(err => {
      debug(err)
      throw new Error('获取确认登录信息失败')
    })
  }

  login() {
    return this.request({
      method: 'GET',
      url: this[API].rediUri
    }).then(res => {
      this[PROP].skey = res.data.match(/<skey>(.*)<\/skey>/)[1]
      this[PROP].sid = res.data.match(/<wxsid>(.*)<\/wxsid>/)[1]
      this[PROP].uin = res.data.match(/<wxuin>(.*)<\/wxuin>/)[1]
      this[PROP].passTicket = res.data.match(/<pass_ticket>(.*)<\/pass_ticket>/)[1]
      if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach(item => {
          if (item.indexOf('webwx_data_ticket') != -1)
            this[PROP].webwx_data_ticket = item.split('; ').shift().split('=').pop()
        })
      }
      this[PROP].baseRequest = {
        'Uin': parseInt(this[PROP].uin, 10),
        'Sid': this[PROP].sid,
        'Skey': this[PROP].skey,
        'DeviceID': this[PROP].deviceId
      }
    }).catch(err => {
      debug(err)
      throw new Error('登录失败')
    })
  }

  init() {
    let params = {
      'pass_ticket': this[PROP].passTicket,
      'skey': this[PROP].skey,
      'r': +new Date()
    }
    let data = {
      BaseRequest: this[PROP].baseRequest
    }
    return this.request({
      method: 'POST',
      url: this[API].webwxinit,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      this[PROP].syncKey = data['SyncKey']
      this.user = data['User']

      let synckeylist = []
      for (let e = this[PROP].syncKey['List'], o = 0, n = e.length; n > o; o++)
        synckeylist.push(e[o]['Key'] + "_" + e[o]['Val'])
      this[PROP].formateSyncKey = synckeylist.join("|")
      
      if (data['BaseResponse']['Ret'] !== 0)
        throw new Error('微信初始化Ret错误' + data['BaseResponse']['Ret'])
    }).catch(err => {
      debug(err)
      throw new Error('微信初始化失败')
    })
  }

  notifyMobile() {
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'Code': 3,
      'FromUserName': this.user['UserName'],
      'ToUserName': this.user['UserName'],
      'ClientMsgId': +new Date()
    }
    return this.request({
      method: 'POST',
      url: this[API].webwxstatusnotify,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0)
        throw new Error('微信初始化Ret错误' + data['BaseResponse']['Ret'])
    }).catch(err => {
      debug(err)
      throw new Error('开启状态通知失败')
    })
  }

  getContact() {
    let params = {
      'lang': 'zh_CN',
      'pass_ticket': this[PROP].passTicket,
      'seq': 0,
      'skey': this[PROP].skey,
      'r': +new Date()
    }
    return this.request({
      method: 'POST',
      url: this[API].webwxgetcontact,
      params: params
    }).then(res => {
      let data = res.data
      this.memberList = data['MemberList']

      for (let member of this.memberList) {
        member['NickName'] = _convertEmoji(member['NickName'])
        member['RemarkName'] = _convertEmoji(member['RemarkName'])

        if (member['VerifyFlag'] & 8) {
          this.publicList.push(member)
        } else if (SPECIALUSERS.indexOf(member['UserName']) > -1) {
          this.specialList.push(member)
        } else if (member['UserName'].indexOf('@@') > -1) {
          this.groupList.push(member)
        } else {
          this.contactList.push(member)
        }
      }
      debug('好友数量：' + this.memberList.length)
      return this.memberList
    }).catch(err => {
      debug(err)
      throw new Error('获取通讯录失败')
    })
  }

  batchGetContact() {
    let params = {
      'pass_ticket': this[PROP].passTicket,
      'type': 'e',
      'r': +new Date()
    }
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      "Count": this.groupList.length,
      'List': this.groupList.map(member => { return { 'UserName': member['UserName'], 'EncryChatRoomId': '' } })
    }
    return this.request({
      method: 'POST',
      url: this[API].webwxbatchgetcontact,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      let contactList = data['ContactList']

      for (let group of contactList) {
        for (let member of group['MemberList']) {
          this.groupMemberList.push(member)
        }
      }
      debug('群组好友总数：', this.groupMemberList.length)
      return this.groupMemberList
    }).catch(err => {
      debug(err)
      throw new Error('获取群组通讯录失败')
    })
  }

  sync() {
    let params = {
      'sid': this[PROP].sid,
      'skey': this[PROP].skey,
      'pass_ticket': this[PROP].passTicket
    }
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      "SyncKey": this[PROP].syncKey,
      'rr': ~new Date()
    }
    return this.request({
      method: 'POST',
      url: this[API].webwxsync,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] == 0) {
        this[PROP].syncKey = data['SyncKey']
        let synckeylist = []
        for (let e = this[PROP].syncKey['List'], o = 0, n = e.length; n > o; o++)
          synckeylist.push(e[o]['Key'] + "_" + e[o]['Val'])
        this[PROP].formateSyncKey = synckeylist.join("|")
      }
      return data
    }).catch(err => {
      debug(err)
      throw new Error('获取新信息失败')
    })
  }

  syncCheck() {
    let params = {
      'r': +new Date(),
      'sid': this[PROP].sid,
      'uin': this[PROP].uin,
      'skey': this[PROP].skey,
      'deviceid': this[PROP].deviceId,
      'synckey': this[PROP].formateSyncKey
    }
    return this.request({
      method: 'GET',
      url: this[API].synccheck,
      params: params,
    }).then(res => {
      let re = /window.synccheck={retcode:"(\d+)",selector:"(\d+)"}/
      let pm = res.data.match(re)

      let retcode = pm[1]
      let selector = pm[2]

      return {
        retcode, selector
      }
    }).catch(err => {
      debug(err)
      throw new Error('同步失败')
    })
  }

  handleMsg(data) {
    debug('Receive ', data['AddMsgList'].length, 'Message')

    data['AddMsgList'].forEach((msg) => {
      let type = msg['MsgType']
      let fromUser = this._getUserRemarkName(msg['FromUserName'])
      let content = msg['Content']

      switch (type) {
        case 51:
          debug(' Message: Wechat Init')
          this.emit('init-message')
          break
        case 1:
          debug(' Text-Message: ', fromUser, ': ', content)
          this.emit('text-message', msg)
          break
        case 3:
          debug(' Picture-Message: ', fromUser, ': ', content)
          this.emit('picture-message', msg)
          break
        case 34:
          debug(' Voice-Message: ', fromUser, ': ', content)
          this.emit('voice-message', msg)
          break
      }
    })
  }

  syncPolling() {
    this.syncCheck().then(state => {
      if (state.retcode == '1100' || state.retcode == '1101') {
        this.state = STATE.logout
        debug(state.retcode == '1100' ? '你登出了微信' : '你在其他地方登录了 WEB 版微信')
        this.emit('logout', state.retcode == '1100' ? '你登出了微信' : '你在其他地方登录了 WEB 版微信')
      } else if (state.retcode == '0') {
        if (state.selector == '2') {
          this.sync().then(data => {
            this.handleMsg(data)
            this.syncPolling()
          }).catch(err => {
            throw err
          })
        } else if (state.selector == '7') {
          debug('WebSync Mobile Open')
          this.emit('mobile-open')
          this.syncPolling()
        } else if (state.selector == '0') {
          debug('WebSync Normal')
          this.syncPolling()
        } else {
          // debug('WebSync Others', state.selector)
          this.syncPolling()
        }
      }
    }).catch(err => {
      debug(err)
    })
  }

  logout() {
    let params = {
      redirect: 1,
      type: 0,
      skey: this[PROP].skey
    }
    // data加上会出错，不加data也能登出
    // let data = {
    //   sid: this[PROP].sid,
    //   uin: this[PROP].uin
    // }
    return this.request({
      method: 'POST',
      url: this[API].webwxlogout,
      params: params
    }).then(res => {
      return '登出成功'
    }).catch(err => {
      debug(err)
      throw new Error('可能登出成功')
    })
  }

  start() {
    return this.checkScan().then(() => {
      this.emit('scan')
      return this.checkLogin()
    }).then(() => {
      this.emit('confirm')
      return this.login()
    }).then(() => {
      return this.init()
    }).then(() => {
      return this.notifyMobile()
    }).then(() => {
      return this.getContact()
    }).then(memberList => {
      this.emit('login', memberList)
      this.state = STATE.login
      this.batchGetContact()
      return this.syncPolling()
    }).catch(err => {
      this.emit('error', err)
      return Promise.reject(err)
    })
  }

  sendMsg(msg, to) {
    let params = {
      'pass_ticket': this[PROP].passTicket
    }
    let clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'Msg': {
        'Type': 1,
        'Content': msg,
        'FromUserName': this.user['UserName'],
        'ToUserName': to,
        'LocalID': clientMsgId,
        'ClientMsgId': clientMsgId
      }
    }
    this.request({
      method: 'POST',
      url: this[API].webwxsendmsg,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0)
        throw new Error('发送信息Ret错误: ' + data['BaseResponse']['Ret'])
    }).catch(err => {
      debug(err)
      throw new Error('发送信息失败')
    })
  }

  sendImage(to, file, type, size) {
    return this._uploadMedia(file, type, size)
      .then(mediaId => this._sendImage(mediaId, to))
      .catch(err => {
        debug(err)
        throw new Error('发送图片信息失败')
      })
  }

  // file: Buffer, Stream, File, Blob
  _uploadMedia(file, type, size) {
    type = type || file.type || (file.path ? mime.lookup(file.path) : null) || ''
    size = size || file.size || (file.path ? fs.statSync(file.path).size : null) || file.length || 0

    let mediaId = this.mediaSend++
    let clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)

    let uploadMediaRequest = JSON.stringify({
      BaseRequest: this[PROP].baseRequest,
      ClientMediaId: clientMsgId,
      TotalLen: size,
      StartPos: 0,
      DataLen: size,
      MediaType: 4
    })

    let form = new FormData()
    form.append('id', 'WU_FILE_' + mediaId)
    form.append('name', 'filename')
    form.append('type', type)
    form.append('lastModifieDate', new Date().toGMTString())
    form.append('size', size)
    form.append('mediatype', 'pic')
    form.append('uploadmediarequest', uploadMediaRequest)
    form.append('webwx_data_ticket', this[PROP].webwx_data_ticket)
    form.append('pass_ticket', encodeURI(this[PROP].passTicket))
    form.append('filename', file, {
      filename: 'filename',
      contentType: type,
      knownLength: size
    })

    let params = {
      f: 'json'
    }

    let headers = typeof form.getHeaders == 'function' ? form.getHeaders() : null

    return new Promise((resolve, reject) => {
      if (typeof form.pipe != 'function')
        resolve(form)

      let pass = new Pass()
      let buf = []
      pass.on('data', chunk => {
        buf.push(chunk)
      })
      pass.on('end', () => {
        let arr = new Uint8Array(Buffer.concat(buf))
        resolve(arr.buffer)
      })
      pass.on('error', err => {
        reject(err)
      })
      form.pipe(pass)
    }).then(data => {
      return this.request({
        url: this[API].webwxuploadmedia,
        method: 'POST',
        headers: headers,
        params: params,
        data: data
      })
    }).then(res => {
      let mediaId = res.data.MediaId
      if (!mediaId)
        throw new Error('MediaId获取失败')
      return mediaId
    }).catch(err => {
      debug(err)
      throw new Error('上传图片失败')
    })
  }

  _sendImage(mediaId, to) {
    let params = {
      'pass_ticket': this[PROP].passTicket,
      'fun': 'async',
      'f': 'json'
    }
    let clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'Msg': {
        'Type': 3,
        'MediaId': mediaId,
        'FromUserName': this.user['UserName'],
        'ToUserName': to,
        'LocalID': clientMsgId,
        'ClientMsgId': clientMsgId
      }
    }
    return this.request({
      method: 'POST',
      url: this[API].webwxsendmsgimg,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] != 0)
        throw new Error('发送图片信息Ret错误: ' + data['BaseResponse']['Ret'])
    }).catch(err => {
      debug(err)
      throw new Error('发送图片失败')
    })
  }

  _getUserRemarkName(uid) {
    let name = ''

    this.memberList.forEach((member) => {
      if (member['UserName'] == uid) {
        return member['RemarkName'] ? member['RemarkName'] : member['NickName']      
      }
    })
  }

}

Wechat.STATE = STATE

exports = module.exports = Wechat
