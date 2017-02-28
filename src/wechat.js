import WechatCore from './core'
import EventEmitter from 'events'

import _ from 'lodash'
import {
  getCONF,
  isStandardBrowserEnv
} from './util'

import ContactFactory from './interface/contact'
import MessageFactory from './interface/message'

import _debug from 'debug'
const debug = _debug('wechat')

if (!isStandardBrowserEnv) {
  process.on('uncaughtException', err => {
    console.log('uncaughtException', err)
  })
}

class Wechat extends WechatCore {

  constructor (data) {
    super(data)
    _.extend(this, new EventEmitter())
    this.state = this.CONF.STATE.init
    this.contacts = {} // 所有联系人
    this.Contact = ContactFactory(this)
    this.Message = MessageFactory(this)
    this.lastSyncTime = 0
    this.syncPollingId = 0
    this.syncErrorCount = 0
    this.checkPollingId = 0
    this.retryPollingId = 0
  }

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

  sendMsg (msg, toUserName) {
    if (typeof msg === 'string') {
      return this.sendText(msg, toUserName)
    } else if (msg.emoticonMd5) {
      return this.sendEmoticon(msg.emoticonMd5, toUserName)
    } else {
      return this.uploadMedia(msg.file, msg.filename, toUserName)
        .then(res => {
          switch (res.ext) {
            case 'bmp':
            case 'jpeg':
            case 'jpg':
            case 'png':
              return this.sendPic(res.mediaId, toUserName)
            case 'gif':
              return this.sendEmoticon(res.mediaId, toUserName)
            case 'mp4':
              return this.sendVideo(res.mediaId, toUserName)
            default:
              return this.sendDoc(res.mediaId, res.name, res.size, res.ext, toUserName)
          }
        })
    }
  }

  syncPolling (id = ++this.syncPollingId) {
    if (this.state !== this.CONF.STATE.login || this.syncPollingId !== id) {
      return
    }
    this.syncCheck().then(selector => {
      debug('Sync Check Selector: ', selector)
      if (+selector !== this.CONF.SYNCCHECK_SELECTOR_NORMAL) {
        return this.sync().then(data => {
          this.syncErrorCount = 0
          this.handleSync(data)
        })
      }
    }).then(() => {
      this.lastSyncTime = Date.now()
      this.syncPolling(id)
    }).catch(err => {
      if (this.state !== this.CONF.STATE.login) {
        return
      }
      debug(err)
      if (this.syncErrorCount++ > 3) {
        this.emit('error', err)
        debug('syncErrorCount: ', this.syncErrorCount)
        this.startInit()
          .then(() => {
            debug('重新初始化成功')
            this.syncPolling(id)
          }).catch(err => {
            debug(err)
            this.stop()
          })
      } else {
        clearTimeout(this.retryPollingId)
        this.retryPollingId = setTimeout(() => {
          this.syncPolling(id)
        }, 1000 * this.syncErrorCount)
      }
    })
  }

  startLogin () {
    const checkLogin = () => {
      return this.checkLogin()
        .then(res => {
          if (res.code === 201 && res.userAvatar) {
            this.emit('user-avatar', res.userAvatar)
          }
          if (res.code !== 200) {
            debug('checkLogin: ', res.code)
            return checkLogin()
          } else {
            return res
          }
        })
    }
    return this.getUUID()
      .then(uuid => {
        debug('getUUID: ', uuid)
        this.emit('uuid', uuid)
        this.state = this.CONF.STATE.uuid
        return checkLogin()
      }).then(res => {
        debug('checkLogin: ', res.redirect_uri)
      })
  }

  startInit () {
    return this.login()
      .then(() => this.init())
      .then(() => this.notifyMobile())
  }

  startGetContact () {
    return this.getContact()
      .then(res => {
        debug('getContact count: ', res.length)
        this.updateContacts(res)
      })
  }

  start () {
    Promise.resolve(this.PROP.uin ? Promise.resolve() : Promise.reject())
      .then(() => {
        return this.init()
          .then(() => this.notifyMobile())
      })
      .catch(() => {
        return this.startLogin()
          .then(() => this.startInit())
      })
      .then(() => {
        this.startGetContact()
          .catch(err => {
            debug(err)
            bot.emit('error', err)
          })
        this.emit('login')
        this.state = this.CONF.STATE.login
        this.lastSyncTime = Date.now()
        this.syncPolling()
        this.checkPolling()
        this.sendMsg('登录成功，退出请向文件传输助手发送\'退出wechat4u\'', 'filehelper')
          .catch(debug)
      }).catch(err => {
        this.emit('error', err)
        debug(err)
        this.stop()
      })
  }

  stop () {
    this.emit('logout')
    this.state = this.CONF.STATE.logout
    clearTimeout(this.retryPollingId)
    clearTimeout(this.checkPollingId)
    this.logout()
  }

  checkPolling () {
    if (this.state !== this.CONF.STATE.login) {
      return
    }
    let interval = Date.now() - this.lastSyncTime
    if (interval > 1 * 60 * 1000) {
      debug(`状态同步超过${interval / 1000}s未响应`)
      this.syncPolling()
    } else {
      debug('心跳')
      this.notifyMobile(this.user.UserName)
        .catch(debug)
      this.sendMsg('心跳：' + new Date().toLocaleString(), 'filehelper')
        .catch(debug)
      clearTimeout(this.checkPollingId)
      this.checkPollingId = setTimeout(() => {
        this.checkPolling()
      }, 5 * 60 * 1000)
    }
  }

  handleSync (data) {
    if (!data) {
      this.stop()
      return
    }
    if (data.AddMsgCount) {
      debug('syncPolling messages count: ', data.AddMsgCount)
      this.handleMsg(data.AddMsgList)
    }
    if (data.ModContactCount) {
      debug('syncPolling ModContactList count: ', data.ModContactCount)
      this.updateContacts(data.ModContactList)
    }
  }

  handleMsg (data) {
    data.forEach(msg => {
      Promise.resolve().then(() => {
        if (!this.contacts[msg.FromUserName]) {
          return this.batchGetContact([{
            UserName: msg.FromUserName
          }]).catch(err => {
            debug(err)
            return [{
              UserName: msg.FromUserName
            }]
          }).then(contacts => {
            this.updateContacts(contacts)
          })
        }
      }).then(() => {
        msg = this.Message.extend(msg)
        this.emit('message', msg)
        if (msg.MsgType === this.CONF.MSGTYPE_STATUSNOTIFY) {
          let userList = msg.StatusNotifyUserName.split(',').map(UserName => {
            return {
              UserName: UserName
            }
          })
          Promise.all(_.chunk(userList, 50).map(list => {
            return this.batchGetContact(list).then(res => {
              debug('batchGetContact data length: ', res.length)
              this.updateContacts(res)
            })
          })).catch(err => {
            debug(err)
          })
        }
        if (msg.ToUserName === 'filehelper' && msg.Content === '退出wechat4u' ||
          /^(.\udf1a\u0020\ud83c.){3}$/.test(msg.Content)) {
          this.stop()
        }
      }).catch(err => {
        this.emit('error', err)
        debug(err)
      })
    })
  }

  updateContacts (contacts) {
    contacts.forEach(contact => {
      if (this.contacts[contact.UserName]) {
        let wechatLayer = Object.getPrototypeOf(this.contacts[contact.UserName])

        // 清除无效的字段并更新 wechatLayer
        for (let i in contact) {
          contact[i] || delete contact[i]
        }
        Object.assign(wechatLayer, contact)
        this.contacts[contact.UserName].init(this)
      } else {
        this.contacts[contact.UserName] = this.Contact.extend(contact)
      }
    })
    this.emit('contacts-updated', contacts)
  }
}

Wechat.STATE = getCONF().STATE

exports = module.exports = Wechat
