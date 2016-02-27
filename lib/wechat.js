"use strict"
var axios = require('axios')
var debug = require('debug')('wechat')
var CM = require('cookie-manager');

const _getTime = () => new Date().getTime()
const webProp = Symbol()
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

exports = module.exports = class wechat {
  constructor() {
    this[webProp] = {
      uuid: '',
      baseUri: '',
      rediUri: '',
      uin: '',
      sid: '',
      skey: '',
      passTicket: '',
      formateSyncKey: '',
      deviceId: 'e' + Math.random().toString().substring(2, 17),

      API_synccheck: '',

      baseRequest: {},
      syncKey: {}
    }

    this.user = [] // 登陆用户
    this.memberList = [] // 所有好友

    this.contactList = [] // 个人好友
    this.groupList = [] // 群
    this.publicList = [] // 公众账号
    this.specialList = [] // 特殊账号

    this.credibleUser = new Set()

    this.axios = axios
    if (typeof window == "undefined") {
      this.cm = new CM()
      this.axios.interceptors.request.use(config => {
        config.headers['cookie'] = decodeURIComponent(this.cm.prepare(config.url))
        config.headers['User-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'
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

    this.memberList.forEach((member) => {
      members.push({
        username: member['UserName'],
        nickname: _convertEmoji(member['NickName']),
        remarkname: _convertEmoji(member['RemarkName']),
        switch: false
      })
    })

    return members
  }

  switchUser(uid) {
    if (this.credibleUser.has(uid)) {
      this.credibleUser.delete(uid)
      this.sendMsg('机器人小助手和您拜拜咯，下次再见！', uid)

      debug('Add', this.credibleUser)
    } else {
      this.credibleUser.add(uid)
      this.sendMsg('我是' + this.user['NickName'] + '的机器人小助手，欢迎调戏！如有打扰请多多谅解', uid)

      debug('Add', this.credibleUser)
    }
    return 200
  }

  sendMsg(msg, to) {
    let url = this[webProp].baseUri + `/webwxsendmsg?pass_ticket=${this[webProp].passTicket}`
    let clientMsgId = _getTime() + '0' + Math.random().toString().substring(2, 5)

    let params = {
      'BaseRequest': this[webProp].baseRequest,
      "Msg": {
        "Type": 1,
        "Content": msg,
        "FromUserName": this.user['UserName'],
        "ToUserName": to,
        "LocalID": clientMsgId,
        "ClientMsgId": clientMsgId
      }
    }

    this.axios({
      method: 'POST',
      url: url,
      data: params,
      headers: {
        'ContentType': 'application/json; charset=UTF-8'
      }
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0)
        throw new Error(data['BaseResponse']['Ret'])
    }).catch(err => {
      debug(err)
      throw new Error('发送信息失败')
    })
  }

  getUUID() {
    let url = 'https://login.weixin.qq.com/jslogin'
    let params = {
      'appid': 'wx782c26e4c19acffb',
      'fun': 'new',
      'lang': 'zh_CN'
    }
    return this.axios({
      method: 'POST',
      url: url,
      params: params
    }).then(res => {
      let re = /window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)"/
      let pm = res.data.match(re)
      if (!pm) {
        throw new Error("GET UUID ERROR")
      }
      let code = pm[1]
      let uuid = this[webProp].uuid = pm[2]

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
    const url = `https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?tip=1&uuid=${this[webProp].uuid}&_=${_getTime()}`
    return this.axios({
      method: 'GET',
      url: url
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
    const url = `https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?tip=0&uuid=${this[webProp].uuid}&_=${_getTime()}`
    return this.axios({
      method: 'GET',
      url: url
    }).then(res => {
      let re = /window.code=(\d+);/
      let pm = res.data.match(re)
      let code = pm[1]

      if (code == 200) {
        let re = /window.redirect_uri="(\S+?)";/
        let pm = res.data.match(re)
        this[webProp].rediUri = pm[1] + '&fun=new'
        this[webProp].baseUri = this[webProp].rediUri.substring(0, this[webProp].rediUri.lastIndexOf("/"))

        // webpush 接口更新
        this._webpushUpdate(this[webProp].baseUri)

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
    return this.axios({
      method: 'GET',
      url: this[webProp].rediUri
    }).then(res => {
      this[webProp].skey = res.data.match(/<skey>(.*)<\/skey>/)[1]
      this[webProp].sid = res.data.match(/<wxsid>(.*)<\/wxsid>/)[1]
      this[webProp].uin = res.data.match(/<wxuin>(.*)<\/wxuin>/)[1]
      this[webProp].passTicket = res.data.match(/<pass_ticket>(.*)<\/pass_ticket>/)[1]

      this[webProp].baseRequest = {
        'Uin': parseInt(this[webProp].uin, 10),
        'Sid': this[webProp].sid,
        'Skey': this[webProp].skey,
        'DeviceID': this[webProp].deviceId
      }

      debug('login Success')
    }).catch(err => {
      debug(err)
      throw new Error('登录失败')
    })
  }

  init() {
    const url = this[webProp].baseUri + `/webwxinit?pass_ticket=${this[webProp].passTicket}&skey=${this[webProp].skey}&r=${_getTime()}`
    const params = {
      BaseRequest: this[webProp].baseRequest
    }

    return this.axios({
      method: 'POST',
      url: url,
      data: params,
      headers: {
        'ContentType': 'application/json; charset=UTF-8'
      }
    }).then(res => {
      let data = res.data
      this[webProp].syncKey = data['SyncKey']
      this.user = data['User']

      let synckeylist = []
      for (let e = this[webProp].syncKey['List'], o = 0, n = e.length; n > o; o++)
        synckeylist.push(e[o]['Key'] + "_" + e[o]['Val'])
      this[webProp].formateSyncKey = synckeylist.join("|")

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
    let url = this[webProp].baseUri + `/webwxstatusnotify?lang=zh_CN&pass_ticket=${this[webProp].passTicket}`
    let params = {
      'BaseRequest': this[webProp].baseRequest,
      "Code": 3,
      "FromUserName": this.user['UserName'],
      "ToUserName": this.user['UserName'],
      "ClientMsgId": _getTime()
    }

    return this.axios({
      method: 'POST',
      url: url,
      data: params,
      headers: {
        'ContentType': 'application/json; charset=UTF-8'
      }
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
    let url = this[webProp].baseUri + `/webwxgetcontact?lang=zh_CN&pass_ticket=${this[webProp].passTicket}&seq=0&skey=${this[webProp].skey}&r=${_getTime()}`
    return this.axios({
      url: url,
      method: 'POST',
      headers: {
        'ContentType': 'application/json; charset=UTF-8'
      }
    }).then(res => {
      let data = res.data
      this.memberList = data['MemberList']

      debug(this.memberList.length)
      return true
    }).catch(err => {
      debug(err)
      throw new Error('获取通讯录失败')
    })
  }

  sync() {
    let url = this[webProp].baseUri + `/webwxsync?sid=${this[webProp].sid}&skey=${this[webProp].skey}&pass_ticket=${this[webProp].passTicket}`
    let params = {
      'BaseRequest': this[webProp].baseRequest,
      "SyncKey": this[webProp].syncKey,
      'rr': ~_getTime()
    }

    return this.axios({
      method: 'POST',
      url: url,
      data: params,
      headers: {
        'ContentType': 'application/json; charset=UTF-8'
      }
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] == 0) {
        this[webProp].syncKey = data['SyncKey']
        let synckeylist = []
        for (let e = this[webProp].syncKey['List'], o = 0, n = e.length; n > o; o++)
          synckeylist.push(e[o]['Key'] + "_" + e[o]['Val'])
        this[webProp].formateSyncKey = synckeylist.join("|")
      }

      return data
    }).catch(err => {
      debug(err)
      throw new Error('获取新信息失败')
    })
  }

  syncCheck() {
    return this.axios({
      method: 'GET',
      url: this[webProp].API_synccheck,
      params: {
        'r': _getTime(),
        'sid': this[webProp].sid,
        'uin': this[webProp].uin,
        'skey': this[webProp].skey,
        'deviceid': this[webProp].deviceId,
        'synckey': this[webProp].formateSyncKey
      },
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
          break
        case 1:
          if (this._checkCredible(msg['FromUserName'])) {
            this._tuning(msg['Content']).then((reply) => {
              debug(reply)
              this.sendMsg(reply, msg['FromUserName'])
            })
          }

          debug(' Message: ', fromUser, ': ', content)
          break
      }
    })
  }

  syncPolling() {
    this.syncCheck().then(state => {
      if (state.retcode == '1100' || state.retcode == '1101') {
        this.logout(state.retcode == '1100' ? '你在手机上登出了微信' : '你在其他地方登录了 WEB 版微信')
      } else if (state.retcode == '0') {
        if (state.selector == '2') {
          this.sync().then(data => {
            this.handleMsg(data)
            this.syncPolling()
          }).catch(err => {
            throw err
          })
        } else if (state.selector == '7') {
          debug('Mobile Open')
          this.syncPolling()
        } else if (state.selector == '0') {
          debug('Normal')
          this.syncPolling()
        }
      }
    }).catch(err => {
      debug(err)
      this.logout(err)
    })
  }

  logout(msg) {
    debug('Logout', msg)
  }

  start() {
    return this.checkLogin()
      .then(this.login)
      .then(this.init)
      .then(this.notifyMobile)
      .then(this.getContact)
      .then(this.syncPolling)
  }

  _webpushUpdate(hostUri) {
    let webpushUri = "webpush.weixin.qq.com"

    if( hostUri.indexOf("wx2.qq.com") > -1 ) {
      webpushUri = "webpush2.weixin.qq.com"
    } else if ( hostUri.indexOf("qq.com") > -1 ) {
      webpushUri = "webpush.weixin.qq.com"
    } else if ( hostUri.indexOf("web1.wechat.com") > -1 ) {
      webpushUri = "webpush1.wechat.com"
    } else if ( hostUri.indexOf("web2.wechat.com") > -1 ) {
      webpushUri = "webpush2.wechat.com"
    } else if ( hostUri.indexOf("wechat.com") > -1 ) {
      webpushUri = "webpush.wechat.com"
    } else if ( hostUri.indexOf("web1.wechatapp.com") > -1 ) {
      webpushUri = "webpush1.wechatapp.com"
    } else {
      webpushUri = "webpush.wechatapp.com"
    }

    this[webProp].API_synccheck = "https://" + webpushUri + "/cgi-bin/mmwebwx-bin/synccheck"
  }

  _checkCredible(uid) {
    return this.credibleUser.has(uid)
  }

  _getUserRemarkName(uid) {
    let name = ''

    this.memberList.forEach((member) => {
      if (member['UserName'] == uid) {
        name = member['RemarkName'] ? member['RemarkName'] : member['NickName']
      }
    })

    return name
  }

  _tuning(word) {
    const url = encodeURI(`http://www.tuling123.com/openapi/api?key=2ba083ae9f0016664dfb7ed80ba4ffa0&info=${word}`)
    return this.axios({
      url: url,
      method: 'GET'
    }).then(res => {
      const data = res.data
      if (data.code == 100000) {
        return data.text + '[微信机器人]'
      }
      return "现在思路很乱，最好联系下我哥 T_T..."
    }).catch(err => {
      debug(err)
      return "现在思路很乱，最好联系下我哥 T_T..."
    })
  }

}