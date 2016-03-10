"use strict"
const EventEmitter = require('events')
const axios = require('axios')
const debug = require('debug')('wechat')
const CM = require('cookie-manager')

// Setting
const _defaultParamsSerializer = (params) => {
  let qs = []
  for (let key in params)
    qs.push(`${key}=${params[key]}`)
  return encodeURI(qs.join('&'))
}

// Private Method
const _getTime = () => new Date().getTime()
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
      deviceId: 'e' + Math.random().toString().substring(2, 17),

      baseRequest: {},
      syncKey: {},
    }
    
    this[API] = {
      baseUri: '',
      rediUri: '',
      
      jsLogin: "https://login.weixin.qq.com/jslogin",
      login: "https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login",
      synccheck: "",
      webwxdownloadmedia: "",
      webwxuploadmedia: ""
    }
    
    this.state = STATE.init

    this.user = [] // 登陆用户
    this.memberList = [] // 所有好友

    this.contactList = [] // 个人好友
    this.groupList = [] // 群
    this.publicList = [] // 公众账号
    this.specialList = [] // 特殊账号

    this.axios = axios.create({
      headers: {'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'}
    })
    
    this.axios.defaults.paramsSerializer = _defaultParamsSerializer
    
    if (typeof window == "undefined") {
      this.cm = new CM()
      this.axios.interceptors.request.use(config => {
        config.headers['cookie'] = decodeURIComponent(this.cm.prepare(config.url))
        return config
      }, err => {
        return Promise.reject(err)
      })
      this.axios.interceptors.response.use(res => {
        let cookies = res.headers['set-cookie']
        if (cookies)
          this.cm.store(res.config.url, cookies)
        return res
      }, err => {
        return Promise.reject(err)
      })
    }
  }

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
    return this.axios.request({
      method: 'POST',
      url: this[API].jsLogin,
      params: params
    }).then(res => {
      this.emit('uuid')
      this.state = STATE.uuid

      let re = /window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)"/
      let pm = res.data.match(re)
      if (!pm) {
        throw new Error("GET UUID ERROR")
      }
      let code = pm[1]
      let uuid = this[PROP].uuid = pm[2]

      if (code != 200) {
        throw new Error("GET UUID ERROR")
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
    return this.axios.request({
      method: 'GET',
      url: this[API].login,
      params: params
    }).then(res => {
      let re = /window.code=(\d+);/
      let pm = res.data.match(re)
      let code = pm[1]

      if (code == 201) {
        return code
      } else if (code == 408) {
        throw new Error(code)
      } else {
        throw new Error(code)
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
    return this.axios.request({
      method: 'GET',
      url: this[API].login,
      params: params
    }).then(res => {
      let re = /window.code=(\d+);/
      let pm = res.data.match(re)
      let code = pm[1]

      if (code == 200) {
        let re = /window.redirect_uri="(\S+?)";/
        let pm = res.data.match(re)
        this[API].rediUri = pm[1] + '&fun=new'
        this[API].baseUri = this[API].rediUri.substring(0, this[API].rediUri.lastIndexOf("/"))

        // 接口更新
        this._APIUpdate(this[API].baseUri)

        return code
      } else {
        throw new Error(code)
      }

    }).catch(err => {
      debug(err)
      throw new Error('获取确认登录信息失败')
    })
  }

  login() {
    return this.axios.request({
      method: 'GET',
      url: this[API].rediUri
    }).then(res => {
      this[PROP].skey = res.data.match(/<skey>(.*)<\/skey>/)[1]
      this[PROP].sid = res.data.match(/<wxsid>(.*)<\/wxsid>/)[1]
      this[PROP].uin = res.data.match(/<wxuin>(.*)<\/wxuin>/)[1]
      this[PROP].passTicket = res.data.match(/<pass_ticket>(.*)<\/pass_ticket>/)[1]

      this[PROP].baseRequest = {
        'Uin': parseInt(this[PROP].uin, 10),
        'Sid': this[PROP].sid,
        'Skey': this[PROP].skey,
        'DeviceID': this[PROP].deviceId
      }

      debug('login Success')
    }).catch(err => {
      debug(err)
      throw new Error('登录失败')
    })
  }

  init() {
    let params = {
      'pass_ticket': this[PROP].passTicket,
      'skey': this[PROP].skey,
      'r': _getTime()
    }
    let data = {
      BaseRequest: this[PROP].baseRequest
    }
    return this.axios.request({
      method: 'POST',
      url: '/webwxinit',
      baseURL: this[API].baseUri,
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

      debug('wechatInit Success')

      if (data['BaseResponse']['Ret'] !== 0)
        throw new Error(data['BaseResponse']['Ret'])
      return true
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
      'ClientMsgId': _getTime()
    }
    return this.axios.request({
      method: 'POST',
      url: '/webwxstatusnotify',
      baseURL: this[API].baseUri,
      data: data
    }).then(res => {
      let data = res.data
      debug('notifyMobile Success')
      if (data['BaseResponse']['Ret'] !== 0)
        throw new Error(data['BaseResponse']['Ret'])
      return true
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
      'r': _getTime()
    }
    return this.axios.request({
      method: 'POST',
      url: '/webwxgetcontact',
      baseURL: this[API].baseUri,
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

      debug(this.memberList.length, ' contacts detected')
      debug(this.publicList.length, ' publicList')
      debug(this.specialList.length, ' specialList')
      debug(this.groupList.length, ' groupList')
      debug(this.contactList.length, ' contactList')

      return this.memberList
    }).catch(err => {
      debug(err)
      throw new Error('获取通讯录失败')
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
      'rr': ~_getTime()
    }
    return this.axios.request({
      method: 'POST',
      url: '/webwxsync',
      baseURL: this[API].baseUri,
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
      'r': _getTime(),
      'sid': this[PROP].sid,
      'uin': this[PROP].uin,
      'skey': this[PROP].skey,
      'deviceid': this[PROP].deviceId,
      'synckey': this[PROP].formateSyncKey
    }
    return this.axios.request({
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
          debug('WebSync Others', state.selector)
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
    return this.axios.request({
      method: 'POST',
      url: '/webwxlogout',
      baseURL: this[API].baseUri,
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
    let clientMsgId = _getTime() + '0' + Math.random().toString().substring(2, 5)
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
    this.axios.request({
      method: 'POST',
      url: '/webwxsendmsg',
      baseURL: this[API].baseUri,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0)
        throw new Error(data['BaseResponse']['Ret'])
    }).catch(err => {
      debug(err)
      throw new Error('发送信息失败')
    })
  }
  
  _APIUpdate(hostUri) {
    let fileUri = ""
    let webpushUri = ""
    
    hostUri.indexOf("wx2.qq.com") > -1 ? (fileUri = "file2.wx.qq.com", webpushUri = "webpush2.weixin.qq.com") 
    : hostUri.indexOf("qq.com") > -1 ? (fileUri = "file.wx.qq.com", webpushUri = "webpush.weixin.qq.com") 
    : hostUri.indexOf("web1.wechat.com") > -1 ? (fileUri = "file1.wechat.com", webpushUri = "webpush1.wechat.com") 
    : hostUri.indexOf("web2.wechat.com") > -1 ? (fileUri = "file2.wechat.com", webpushUri = "webpush2.wechat.com") 
    : hostUri.indexOf("wechat.com") > -1 ? (fileUri = "file.wechat.com", webpushUri = "webpush.wechat.com") 
    : hostUri.indexOf("web1.wechatapp.com") > -1 ? (fileUri = "file1.wechatapp.com", webpushUri = "webpush1.wechatapp.com") 
    : (fileUri = "file.wechatapp.com", webpushUri = "webpush.wechatapp.com");
    
    this[API].webwxdownloadmedia = "https://" + fileUri + "/cgi-bin/mmwebwx-bin/webwxgetmedia",
    this[API].webwxuploadmedia = "https://" + fileUri + "/cgi-bin/mmwebwx-bin/webwxuploadmedia",
    this[API].synccheck = "https://" + webpushUri + "/cgi-bin/mmwebwx-bin/synccheck"
  }

  _getUserRemarkName(uid) {
    let name = ''

    this.memberList.forEach((member) => {
      if (member['UserName'] == uid) {
        name = member['RemarkName'] ? member['RemarkName'] 
        : member['NickName']
      }
    })

    return name
  }

}

Wechat.STATE = STATE

exports = module.exports = Wechat
