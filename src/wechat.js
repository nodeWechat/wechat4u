import EventEmitter from 'events'
import fs from 'fs'
import path from 'path'

import _debug from 'debug'
import FormData from 'form-data'
import mime from 'mime'
import {Request, isStandardBrowserEnv} from './util'

import ContactFactory from './interface/contact'
import MessageFactory from './interface/message'
import ConfFactory from './interface/conf'

const debug = _debug('wechat')
// Private
const PROP = Symbol()

class Wechat extends EventEmitter {

  constructor () {
    super()
    this[PROP] = {
      uuid: '',
      uin: '',
      sid: '',
      skey: '',
      passTicket: '',
      formateSyncKey: '',
      webwxDataTicket: '',
      deviceId: 'e' + Math.random().toString().substring(2, 17),

      baseRequest: {},
      syncKey: {}
    }

    this.CONF = ConfFactory()

    this.syncErrorCount = 0
    this.mediaSend = 0
    this.state = this.CONF.STATE.init
    this.baseUri = ''

    this.user = {} // 登陆账号
    this.contacts = {} // 所有联系人

    this.Contact = ContactFactory(this)
    this.Message = MessageFactory(this)

    this.request = new Request()
  }

  setProp (key, val) {
    this[PROP][key] = val
  }

  getProp (key) {
    return this[PROP][key]
  }

  // 通讯录好友
  get friendList () {
    let members = []

    for (let key in this.contacts) {
      let member = this.contacts[key]
      members.push({
        username: member['UserName'],
        nickname: this.Contact.getDisplayName(member),
        py: member['RemarkPYQuanPin'] ? member['RemarkPYQuanPin'] : member['PYQuanPin'],
        avatar: member.AvatarUrl
      })
    }

    return members
  }

  getUUID () {
    return this.request({
      method: 'POST',
      url: this.CONF.API_jsLogin
    }).then(res => {
      let pm = res.data.match(/window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)"/)
      if (!pm) {
        throw new Error('UUID错误: 格式错误')
      }
      let code = +pm[1]
      let uuid = this[PROP].uuid = pm[2]

      if (code !== 200) {
        throw new Error('UUID错误: ' + code)
      }

      this.emit('uuid', uuid)
      this.state = this.CONF.STATE.uuid

      return uuid
    }).catch(err => {
      debug(err)
      throw new Error('获取UUID失败')
    })
  }

  checkScan () {
    debug('CheckScan')
    let params = {
      'tip': 1,
      'uuid': this[PROP].uuid
    }
    return this.request({
      method: 'GET',
      url: this.CONF.API_login,
      params: params
    }).then(res => {
      let pm = res.data.match(/window.code=(\d+);/)
      let code = +pm[1]

      if (code !== 201) {
        throw new Error('扫描状态code错误: ' + code)
      }

      this.emit('scan')
    }).catch(err => {
      debug(err)
      throw new Error('获取扫描状态信息失败')
    })
  }

  checkLogin () {
    let params = {
      'tip': 0,
      'uuid': this[PROP].uuid
    }
    return this.request({
      method: 'GET',
      url: this.CONF.API_login,
      params: params
    }).then(res => {
      let pm = res.data.match(/window.code=(\d+);/)
      let code = pm[1]

      if (code !== '200') {
        throw new Error('登陆确认code错误: ' + code)
      }

      pm = res.data.match(/window.redirect_uri="(\S+?)";/)
      // 接口更新
      this.CONF = new ConfFactory(pm[1].substring(0, pm[1].lastIndexOf('/')))
      this.rediUri = pm[1] + '&fun=new'
      this.baseUri = this.CONF.baseUri

      this.emit('confirm')
    }).catch(err => {
      debug(err)
      throw new Error('获取确认登录信息失败')
    })
  }

  login () {
    return this.request({
      method: 'GET',
      url: this.rediUri
    }).then(res => {
      this[PROP].skey = res.data.match(/<skey>(.*)<\/skey>/)[1]
      this[PROP].sid = res.data.match(/<wxsid>(.*)<\/wxsid>/)[1]
      this[PROP].uin = res.data.match(/<wxuin>(.*)<\/wxuin>/)[1]
      this[PROP].passTicket = res.data.match(/<pass_ticket>(.*)<\/pass_ticket>/)[1]
      if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach(item => {
          if (item.indexOf('webwxDataTicket') !== -1) {
            this[PROP].webwxDataTicket = item.split('; ').shift().split('=').pop()
          }
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

  init () {
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
      url: this.CONF.API_webwxinit,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('微信初始化Ret错误' + data['BaseResponse']['Ret'])
      }

      this.user = this.Contact.extend(data['User'])

      for (let contact of data.ContactList) {
        this._addContact(contact)
      }

      this._updateSyncKey(data['SyncKey'])

      return this.batchGetContact(data.ChatSet.split(',').map(username => {
        return {
          UserName: username
        }
      }))
    }).catch(err => {
      debug(err)
      throw new Error('微信初始化失败')
    })
  }

  notifyMobile () {
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'Code': 3,
      'FromUserName': this.user['UserName'],
      'ToUserName': this.user['UserName'],
      'ClientMsgId': +new Date()
    }
    return this.request({
      method: 'POST',
      url: this.CONF.API_webwxstatusnotify,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('开启状态通知Ret错误' + data['BaseResponse']['Ret'])
      }
    }).catch(err => {
      debug(err)
      throw new Error('开启状态通知失败')
    })
  }

  getContact () {
    let params = {
      'lang': 'zh_CN',
      'pass_ticket': this[PROP].passTicket,
      'seq': 0,
      'skey': this[PROP].skey,
      'r': +new Date()
    }
    return this.request({
      method: 'POST',
      url: this.CONF.API_webwxgetcontact,
      params: params
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('通讯录获取Ret错误' + data['BaseResponse']['Ret'])
      }

      for (let member of data.MemberList) {
        this._addContact(member)
      }

      this.state = this.CONF.STATE.login
      this.emit('login', this.contacts)

      debug('联系人数量：' + Object.keys(this.contacts).length)
      return this.contacts
    }).catch(err => {
      debug(err)
      throw new Error('获取通讯录失败')
    })
  }

  batchGetContact (contacts) {
    let params = {
      'pass_ticket': this[PROP].passTicket,
      'type': 'e',
      'r': +new Date()
    }
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'Count': contacts.length,
      'List': contacts
    }
    return this.request({
      method: 'POST',
      url: this.CONF.API_webwxbatchgetcontact,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('批量获取联系人Ret错误' + data['BaseResponse']['Ret'])
      }

      for (let contact of data.ContactList) {
        this._addContact(contact)
      }
      debug('批量获取联系人: ', data.ContactList.length)
      return this.contacts
    }).catch(err => {
      debug(err)
      throw new Error('批量获取联系人失败')
    })
  }

  syncPolling () {
    this._syncCheck().then(state => {
      if (state.retcode !== this.CONF.SYNCCHECK_RET_SUCCESS) {
        debug(state.retcode, this.CONF.SYNCCHECK_RET_SUCCESS)
        throw new Error('你登出了微信')
      } else {
        if (state.selector !== this.CONF.SYNCCHECK_SELECTOR_NORMAL) {
          return this._sync().then(data => {
            setTimeout(() => {
              this.syncPolling()
            }, 1000)
            this._handleMsg(data)
          })
        } else {
          debug('WebSync Normal')
          setTimeout(() => {
            this.syncPolling()
          }, 1000)
        }
      }
    }).catch(err => {
      if (++this.syncErrorCount > 3) {
        debug(err)
        this.emit('error', err)
        this.logout()
      } else {
        setTimeout(() => {
          this.syncPolling()
        }, 1000)
      }
    })
  }

  logout () {
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
      url: this.CONF.API_webwxlogout,
      params: params
    }).then(res => {
      this.state = this.CONF.STATE.logout
      this.emit('logout')
      return '登出成功'
    }).catch(err => {
      debug(err)
      this.state = this.CONF.STATE.logout
      this.emit('logout')
      throw new Error('可能登出成功')
    })
  }

  start () {
    return Promise.resolve(this.state === this.CONF.STATE.uuid ? 0 : this.getUUID())
      .then(() => this.checkScan())
      .then(() => this.checkLogin())
      .then(() => this.login())
      .then(() => this.init())
      .then(() => this.notifyMobile())
      .then(() => this.getContact())
      .then(() => {
        if (this.state !== this.CONF.STATE.login) {
          throw new Error('登陆失败，未进入SyncPolling')
        }
        return this.syncPolling()
      }).catch(err => {
        debug('启动失败', err)
        this.stop()
        throw new Error('启动失败')
      })
  }

  stop () {
    return this.state === this.CONF.STATE.login ? this.logout() : Promise.resolve()
  }

  sendMsg (msg, to) {
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
      url: this.CONF.API_webwxsendmsg,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('发送信息Ret错误: ' + data['BaseResponse']['Ret'])
      }
    }).catch(err => {
      debug(err)
      throw new Error('发送信息失败')
    })
  }

  sendEmoticon (id, to) {
    let params = {
      'fun': 'sys',
      'pass_ticket': this[PROP].passTicket
    }
    let clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'Msg': {
        'Type': 47,
        'EmojiFlag': 2,
        'FromUserName': this.user['UserName'],
        'ToUserName': to,
        'LocalID': clientMsgId,
        'ClientMsgId': clientMsgId
      },
      'Scene': 0
    }

    if (id.indexOf('@') === 0) {
      data.Msg.MediaId = id
    } else {
      data.Msg.EMoticonMd5 = id
    }

    this.request({
      method: 'POST',
      url: this.CONF.API_webwxsendemoticon,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('发送表情Ret错误: ' + data['BaseResponse']['Ret'])
      }
    }).catch(err => {
      debug(err)
      throw new Error('发送表情失败')
    })
  }

  sendMedia (file, to) {
    return this._uploadMedia(file)
      .then(res => {
        switch (res.mediatype) {
          case 'pic':
            return this._sendPic(res.mediaId, to)
          case 'video':
            return this._sendVideo(res.mediaId, to)
          case 'doc':
            if (res.ext === 'gif') {
              return this.sendEmoticon(res.mediaId, to)
            } else {
              return this._sendDoc(res.mediaId, res.name, res.size, res.ext, to)
            }
        }
      })
      .catch(err => {
        debug(err)
        throw new Error('发送媒体文件失败')
      })
  }

  _syncCheck () {
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
      url: this.CONF.API_synccheck,
      params: params
    }).then(res => {
      let re = /window.synccheck={retcode:"(\d+)",selector:"(\d+)"}/
      let pm = res.data.match(re)

      let retcode = +pm[1]
      let selector = +pm[2]

      return {
        retcode, selector
      }
    }).catch(err => {
      debug(err)
      throw new Error('同步失败')
    })
  }

  _sync () {
    let params = {
      'sid': this[PROP].sid,
      'skey': this[PROP].skey,
      'pass_ticket': this[PROP].passTicket
    }
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'SyncKey': this[PROP].syncKey,
      'rr': ~new Date()
    }
    return this.request({
      method: 'POST',
      url: this.CONF.API_webwxsync,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('拉取消息Ret错误: ' + data['BaseResponse']['Ret'])
      }

      this._updateSyncKey(data['SyncKey'])
      return data
    }).catch(err => {
      debug(err)
      throw new Error('获取新信息失败')
    })
  }

  _handleMsg (data) {
    debug('Receive ', data.AddMsgList.length, 'Message')

    data['AddMsgList'].forEach(msg => {
      Promise.resolve().then(() => {
        if (!this.contacts[msg.FromUserName]) {
          return this.batchGetContact([{
            UserName: msg.FromUserName
          }]).catch(err => {
            debug(err)
            this._addContact({
              UserName: msg.FromUserName
            })
          }).then(() => {
            return this.contacts[msg.FromUserName]
          })
        } else {
          return this.contacts[msg.FromUserName]
        }
      }).then(fromUser => {
        this.Message.extend(msg)

        switch (msg.MsgType) {
          case this.CONF.MSGTYPE_STATUSNOTIFY:
            debug(' Message: Init')
            this.emit('init-message')
            break
          case this.CONF.MSGTYPE_TEXT:
            debug(' Text-Message: ', fromUser.getDisplayName(), ': ', msg.Content)
            this.emit('text-message', msg)
            break
          case this.CONF.MSGTYPE_IMAGE:
            debug(' Image-Message: ', fromUser.getDisplayName(), ': ', msg.Content)
            this.emit('image-message', msg)
            break
          case this.CONF.MSGTYPE_VOICE:
            debug(' Voice-Message: ', fromUser.getDisplayName(), ': ', msg.Content)
            this.emit('voice-message', msg)
            break
          case this.CONF.MSGTYPE_EMOTICON:
            debug(' Emoticon-Message: ', fromUser.getDisplayName(), ': ', msg.Content)
            this.emit('emoticon-message', msg)
            break
          case this.CONF.MSGTYPE_VERIFYMSG:
            debug(' Verify-Message: ', fromUser.getDisplayName())
            this.emit('verify-message', msg)
            break
          case this.CONF.MSGTYPE_RECALLED:
            debug(' Recalled-Message: ', fromUser.getDisplayName())
            this.emit('recalled-message', msg)
            break
          default:
            debug(' Other-Message: ', fromUser.getDisplayName(), ': ', msg.MsgType)
            this.emit('other-message', msg)
            break
        }
      })
    })
  }

  // file: Stream, File
  _uploadMedia (file) {
    let name, type, size, lastModifiedDate
    if (isStandardBrowserEnv) {
      name = file.name
      type = file.type
      size = file.size
      lastModifiedDate = file.lastModifiedDate
    } else {
      name = path.basename(file.path)
      type = mime.lookup(name)
      let stat = fs.statSync(file.path)
      size = stat.size
      lastModifiedDate = stat.mtime
    }

    let ext = name.match(/.*\.(.*)/)
    if (ext) {
      ext = ext[1]
    }

    let mediatype
    switch (ext) {
      case 'bmp':
      case 'jpeg':
      case 'jpg':
      case 'png':
        mediatype = 'pic'
        break
      case 'mp4':
        mediatype = 'video'
        break
      default:
        mediatype = 'doc'
    }

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
    form.append('name', name)
    form.append('type', type)
    form.append('lastModifiedDate', lastModifiedDate.toGMTString())
    form.append('size', size)
    form.append('mediatype', mediatype)
    form.append('uploadmediarequest', uploadMediaRequest)
    form.append('webwx_data_ticket', this[PROP].webwxDataTicket)
    form.append('pass_ticket', encodeURI(this[PROP].passTicket))
    form.append('filename', file, {
      filename: name,
      contentType: type,
      knownLength: size
    })

    let params = {
      f: 'json'
    }

    return this.request({
      url: this.CONF.API_webwxuploadmedia,
      method: 'POST',
      headers: form.getHeaders(),
      params: params,
      data: form
    }).then(res => {
      let mediaId = res.data.MediaId
      if (!mediaId) {
        throw new Error('MediaId获取失败')
      }
      return {
        name: name,
        size: size,
        ext: ext,
        mediatype: mediatype,
        mediaId: mediaId
      }
    }).catch(err => {
      debug(err)
      throw new Error('上传媒体文件失败')
    })
  }

  _sendPic (mediaId, to) {
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
        'FromUserName': this.user.UserName,
        'ToUserName': to,
        'LocalID': clientMsgId,
        'ClientMsgId': clientMsgId
      }
    }
    return this.request({
      method: 'POST',
      url: this.CONF.API_webwxsendmsgimg,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('发送图片Ret错误: ' + data['BaseResponse']['Ret'])
      }
    }).catch(err => {
      debug(err)
      throw new Error('发送图片失败')
    })
  }

  _sendVideo (mediaId, to) {
    let params = {
      'pass_ticket': this[PROP].passTicket,
      'fun': 'async',
      'f': 'json'
    }
    let clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'Msg': {
        'Type': 43,
        'MediaId': mediaId,
        'FromUserName': this.user.UserName,
        'ToUserName': to,
        'LocalID': clientMsgId,
        'ClientMsgId': clientMsgId
      }
    }
    return this.request({
      method: 'POST',
      url: this.CONF.API_webwxsendmsgvedio,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('发送视频Ret错误: ' + data['BaseResponse']['Ret'])
      }
    }).catch(err => {
      debug(err)
      throw new Error('发送视频失败')
    })
  }

  _sendDoc (mediaId, name, size, ext, to) {
    let params = {
      'pass_ticket': this[PROP].passTicket,
      'fun': 'async',
      'f': 'json'
    }
    let clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)
    let data = {
      'BaseRequest': this[PROP].baseRequest,
      'Msg': {
        'Type': 6,
        'Content': `<appmsg appid='wx782c26e4c19acffb' sdkver=''><title>${name}</title><des></des><action></action><type>6</type><content></content><url></url><lowurl></lowurl><appattach><totallen>${size}</totallen><attachid>${mediaId}</attachid><fileext>${ext}</fileext></appattach><extinfo></extinfo></appmsg>`,
        'FromUserName': this.user.UserName,
        'ToUserName': to,
        'LocalID': clientMsgId,
        'ClientMsgId': clientMsgId
      }
    }
    return this.request({
      method: 'POST',
      url: this.CONF.API_webwxsendappmsg,
      params: params,
      data: data
    }).then(res => {
      let data = res.data
      if (data['BaseResponse']['Ret'] !== 0) {
        throw new Error('发送文件Ret错误: ' + data['BaseResponse']['Ret'])
      }
    }).catch(err => {
      debug(err)
      throw new Error('发送文件失败')
    })
  }

  _getMsgImg (msgId) {
    let params = {
      MsgID: msgId,
      skey: this[PROP].skey
    }

    return this.request({
      method: 'GET',
      url: this.CONF.API_webwxgetmsgimg,
      params: params,
      responseType: 'arraybuffer'
    }).then(res => {
      return {
        data: res.data,
        type: res.headers['content-type']
      }
    }).catch(err => {
      debug(err)
      throw new Error('获取图片失败')
    })
  }

  _getVoice (msgId) {
    let params = {
      MsgID: msgId,
      skey: this[PROP].skey
    }

    return this.request({
      method: 'GET',
      url: this.CONF.API_webwxgetvoice,
      params: params,
      responseType: 'arraybuffer'
    }).then(res => {
      return {
        data: res.data,
        type: res.headers['content-type']
      }
    }).catch(err => {
      debug(err)
      throw new Error('获取声音失败')
    })
  }

  _getEmoticon (content) {
    return Promise.resolve().then(() => {
      return this.request({
        method: 'GET',
        url: content.match(/cdnurl ?= ?"(.*?)"/)[1],
        responseType: 'arraybuffer'
      })
    }).then(res => {
      return {
        data: res.data,
        type: res.headers['content-type'],
        url: res.config.url
      }
    }).catch(err => {
      debug(err)
      throw new Error('获取表情失败')
    })
  }

  _getHeadImg (member) {
    let url = member.AvatarUrl ? member.AvatarUrl : this.baseUri.match(/http.*?\/\/.*?(?=\/)/)[0] + member.HeadImgUrl
    return this.request({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    }).then(res => {
      let headImg = {
        data: res.data,
        type: res.headers['content-type']
      }
      member.HeadImg = headImg
      return headImg
    }).catch(err => {
      debug(err)
      throw new Error('获取头像失败')
    })
  }

  _updateSyncKey (syncKey) {
    this[PROP].syncKey = syncKey
    let synckeylist = []
    for (let e = this[PROP].syncKey['List'], o = 0, n = e.length; n > o; o++) {
      synckeylist.push(e[o]['Key'] + '_' + e[o]['Val'])
    }
    this[PROP].formateSyncKey = synckeylist.join('|')
  }

  _addContact (contact) {
    this.Contact.extend(contact)
    this.contacts[contact.UserName] = contact
  }
}

Wechat.STATE = ConfFactory().STATE

exports = module.exports = Wechat
