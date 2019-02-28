import _debug from 'debug'
import EventEmitter from 'events'
import _ from 'lodash'

import WechatCore, { AlreadyLogoutError } from './core'
import ContactFactory from './interface/contact'
import MessageFactory from './interface/message'
import { getCONF, isStandardBrowserEnv } from './util'

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
    if (typeof msg !== 'object') {
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
      if (err instanceof AlreadyLogoutError) {
        this.stop()
        return
      }
      this.emit('error', err)
      if (++this.syncErrorCount > 2) {
        let err = new Error(`连续${this.syncErrorCount}次同步失败，5s后尝试重启`)
        debug(err)
        this.emit('error', err)
        clearTimeout(this.retryPollingId)
        setTimeout(() => this.restart(), 5 * 1000)
      } else {
        clearTimeout(this.retryPollingId)
        this.retryPollingId = setTimeout(() => this.syncPolling(id), 2000 * this.syncErrorCount)
      }
    })
  }

  _getContact (Seq = 0) {
    let contacts = []
    return this.getContact(Seq)
      .then(res => {
        contacts = res.MemberList || []
        if (res.Seq) {
          return this._getContact(res.Seq)
            .then(_contacts => contacts = contacts.concat(_contacts || []))
        }
      })
      .then(() => {
        if (Seq == 0) {
          let emptyGroup =
            contacts.filter(contact => contact.UserName.startsWith('@@') && contact.MemberCount == 0)
          if (emptyGroup.length != 0) {
            return this.batchGetContact(emptyGroup)
              .then(_contacts => contacts = contacts.concat(_contacts || []))
          } else {
            return contacts
          }
        } else {
          return contacts
        }
      })
      .catch(err => {
        this.emit('error', err)
        return contacts
      })
  }

  _init () {
    return this.init()
      .then(data => {
        // this.getContact() 这个接口返回通讯录中的联系人（包括已保存的群聊）
        // 临时的群聊会话在初始化的接口中可以获取，因此这里也需要更新一遍 contacts
        // 否则后面可能会拿不到某个临时群聊的信息
        this.updateContacts(data.ContactList)

        this.notifyMobile()
          .catch(err => this.emit('error', err))
        this._getContact()
          .then(contacts => {
            debug('getContact count: ', contacts.length)
            this.updateContacts(contacts)
          })
        this.emit('init', data)
        this.state = this.CONF.STATE.login
        this.lastSyncTime = Date.now()
        this.syncPolling()
        this.checkPolling()
        this.emit('login')
      })
  }

  _login () {
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
      })
      .then(res => {
        debug('checkLogin: ', res.redirect_uri)
        return this.login()
      })
  }

  start () {
    debug('启动中...')
    return this._login()
      .then(() => this._init())
      .catch(err => {
        debug(err)
        this.emit('error', err)
        this.stop()
      })
  }

  restart () {
    debug('重启中...')
    return this._init()
      .catch(err => {
        if (err instanceof AlreadyLogoutError) {
          this.emit('logout')
          return
        }
        if (err.response) {
          throw err
        } else {
          let err = new Error('重启时网络错误，60s后进行最后一次重启')
          debug(err)
          this.emit('error', err)
          return new Promise(resolve => {
            setTimeout(resolve, 60 * 1000)
          }).then(() => this.init())
            .then(data => {
              this.updateContacts(data.ContactList)
            })
        }
      }).catch(err => {
        debug(err)
        this.emit('error', err)
        this.stop()
      })
  }

  stop () {
    debug('登出中...')
    clearTimeout(this.retryPollingId)
    clearTimeout(this.checkPollingId)
    this.logout()
    this.state = this.CONF.STATE.logout
    this.emit('logout')
  }

  checkPolling () {
    if (this.state !== this.CONF.STATE.login) {
      return
    }
    let interval = Date.now() - this.lastSyncTime
    if (interval > 1 * 60 * 1000) {
      let err = new Error(`状态同步超过${interval / 1000}s未响应，5s后尝试重启`)
      debug(err)
      this.emit('error', err)
      clearTimeout(this.checkPollingId)
      setTimeout(() => this.restart(), 5 * 1000)
    } else {
      debug('心跳')
      this.notifyMobile()
        .catch(err => {
          debug(err)
          this.emit('error', err)
        })
      this.sendMsg(this._getPollingMessage(), this._getPollingTarget())
        .catch(err => {
          debug(err)
          this.emit('error', err)
        })
      clearTimeout(this.checkPollingId)
      this.checkPollingId = setTimeout(() => this.checkPolling(), this._getPollingInterval())
    }
  }

  handleSync (data) {
    if (!data) {
      this.restart()
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
        if (!this.contacts[msg.FromUserName] ||
          (msg.FromUserName.startsWith('@@') && this.contacts[msg.FromUserName].MemberCount == 0)) {
          return this.batchGetContact([{
            UserName: msg.FromUserName
          }]).then(contacts => {
            this.updateContacts(contacts)
          }).catch(err => {
            debug(err)
            this.emit('error', err)
          })
        }
      }).then(() => {
        msg = this.Message.extend(msg)
        this.emit('message', msg)
        if (msg.MsgType === this.CONF.MSGTYPE_STATUSNOTIFY) {
          let userList = msg.StatusNotifyUserName.split(',').filter(UserName => !this.contacts[UserName])
            .map(UserName => {
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
            this.emit('error', err)
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
    if (!contacts || contacts.length == 0) {
      return
    }
    contacts.forEach(contact => {
      if (this.contacts[contact.UserName]) {
        let oldContact = this.contacts[contact.UserName]
        // 清除无效的字段
        for (let i in contact) {
          contact[i] || delete contact[i]
        }
        Object.assign(oldContact, contact)
        this.Contact.extend(oldContact)
      } else {
        this.contacts[contact.UserName] = this.Contact.extend(contact)
      }
    })
    this.emit('contacts-updated', contacts)
  }

  _getPollingMessage () { // Default polling message
    return '心跳：' + new Date().toLocaleString()
  }

  _getPollingInterval () { // Default polling interval
    return 5 * 60 * 1000
  }

  _getPollingTarget () { // Default polling target user
    return 'filehelper'
  }

  setPollingMessageGetter (func) {
    if (typeof (func) !== 'function') return
    if (typeof (func()) !== 'string') return
    this._getPollingMessage = func
  }

  setPollingIntervalGetter (func) {
    if (typeof (func) !== 'function') return
    if (typeof (func()) !== 'number') return
    this._getPollingInterval = func
  }

  setPollingTargetGetter (func) {
    if (typeof (func) !== 'function') return
    if (typeof (func()) !== 'string') return
    this._getPollingTarget = func
  }
}

Wechat.STATE = getCONF().STATE

exports = module.exports = Wechat
