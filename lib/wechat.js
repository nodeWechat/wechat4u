"use strict"
var axios = require('axios')
var debug = require('debug')('wechat')
var xmlPrase = require('xml2js').parseString
var CM = require('cookie-manager');

const _getTime = () => new Date().getTime()

exports = module.exports = class wechat {
  constructor() {
    this.uuid = ''
    this.baseURI = ''
    this.redirectURI = ''
    this.webpush = ''
    this.uin = ''
    this.sid = ''
    this.skey = ''
    this.passTicket = ''
    this.BaseRequest = {}
    this.synckey = ''
    this.SyncKey = []
    this.user = []
    this.memberList = []
    this.contactList = []
    this.groupList = []
    this.deviceId = 'e' + Math.random().toString().substring(2, 17)
    this.credibleUser = new Set()

    this.axios = axios
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

    this.memberList.forEach((member) => {
      members.push({
        username: member['UserName'],
        nickname: member['RemarkName'] ? member['RemarkName'] : member['NickName'].replace(/<\/?[^>]*>/g, ''),
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
    let url = this.baseURI + `/webwxsendmsg?pass_ticket=${this.passTicket}`
    let clientMsgId = _getTime() + '0' + Math.random().toString().substring(2, 5)

    let params = {
      'BaseRequest': this.BaseRequest,
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
      let uuid = this.uuid = pm[2]

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
    const url = `https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?tip=1&uuid=${this.uuid}&_=${_getTime()}`
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
    const url = `https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?tip=0&uuid=${this.uuid}&_=${_getTime()}`
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
        this.redirectURI = pm[1] + '&fun=new'
        this.baseURI = this.redirectURI.substring(0, this.redirectURI.lastIndexOf("/"))
        if (this.baseURI[10] == 2) {
          this.webpush = 'webpush2'
        } else {
          this.webpush = 'webpush'
        }
        return code
      } else if (code == 408) {
        throw new Error(code)
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
      url: this.redirectURI
    }).then(res => {
      xmlPrase(res.data, (err, result) => {
        const data = result['error']

        this.skey = data['skey'][0]
        this.sid = data['wxsid'][0]
        this.uin = data['wxuin'][0]
        this.passTicket = data['pass_ticket'][0]

        this.BaseRequest = {
          'Uin': parseInt(this.uin, 10),
          'Sid': this.sid,
          'Skey': this.skey,
          'DeviceID': this.deviceId
        }

        debug('login Success')
        return true
      })
    }).catch(err => {
      debug(err)
      throw new Error('登录失败')
    })
  }

  init() {
    const url = this.baseURI + `/webwxinit?pass_ticket=${this.passTicket}&skey=${this.skey}&r=${_getTime()}`
    const params = {
      BaseRequest: this.BaseRequest
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
      this.SyncKey = data['SyncKey']
      this.user = data['User']

      let synckeylist = []
      for (let e = this.SyncKey['List'], o = 0, n = e.length; n > o; o++)
        synckeylist.push(e[o]['Key'] + "_" + e[o]['Val'])
      this.synckey = synckeylist.join("|")

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
    let url = this.baseURI + `/webwxstatusnotify?lang=zh_CN&pass_ticket=${this.passTicket}`
    let params = {
      'BaseRequest': this.BaseRequest,
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
    let url = this.baseURI + `/webwxgetcontact?lang=zh_CN&pass_ticket=${this.passTicket}&seq=0&skey=${this.skey}&r=${_getTime()}`
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
    let url = this.baseURI + `/webwxsync?sid=${this.sid}&skey=${this.skey}&pass_ticket=${this.passTicket}`
    let params = {
      'BaseRequest': this.BaseRequest,
      "SyncKey": this.SyncKey,
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
        this.SyncKey = data['SyncKey']
        let synckeylist = []
        for (let e = this.SyncKey['List'], o = 0, n = e.length; n > o; o++)
          synckeylist.push(e[o]['Key'] + "_" + e[o]['Val'])
        this.synckey = synckeylist.join("|")
      }

      return data
    }).catch(err => {
      debug(err)
      throw new Error('获取新信息失败')
    })
  }

  syncCheck() {
    let url = `https://${this.webpush}.weixin.qq.com/cgi-bin/mmwebwx-bin/synccheck`

    return this.axios({
      method: 'GET',
      url: url,
      params: {
        'r': _getTime(),
        'sid': this.sid,
        'uin': this.uin,
        'skey': this.skey,
        'deviceid': this.deviceId,
        'synckey': this.synckey
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
