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

  constructor () {
    super()
    _.extend(this, new EventEmitter())
    this.state = this.CONF.STATE.init
    this.contacts = {} // 所有联系人
    this.Contact = ContactFactory(this)
    this.Message = MessageFactory(this)
    this.lastReportTime = 0
    this.syncErrorCount = 0
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

  syncPolling (callback) {
    this.syncCheck().then(selector => {
      debug('Sync Check Selector: ', selector)
      if (selector !== this.CONF.SYNCCHECK_SELECTOR_NORMAL) {
        return this.sync().then(data => {
          this.syncErrorCount = 0
          callback(data)
        })
      }
    }).then(() => {
      this.syncPolling(callback)
      if (+new Date() - this.lastReportTime > 5 * 60 * 1000) {
        debug('Status Report')
        this.notifyMobile(this.user.UserName)
          .catch(debug)
        this.sendText('心跳：' + new Date().toLocaleString(), 'filehelper')
          .catch(debug)
        this.lastReportTime = +new Date()
      }
    }).catch(err => {
      this.emit('error', err)
      if (this.syncErrorCount++ > 5) {
        debug(err)
        this.logout()
        callback()
      } else {
        setTimeout(() => {
          this.syncPolling(callback)
        }, 1000 * this.syncErrorCount)
      }
    })
  }

  async start () {
    let ret
    try {
      ret = await this.getUUID()
      debug('getUUID: ', ret)
      this.emit('uuid', ret)
      this.state = this.CONF.STATE.uuid
      do {
        ret = await this.checkLogin()
        debug('checkLogin: ', ret)
        if (ret.code === 201 && ret.userAvatar) {
          this.emit('user-avatar', ret.userAvatar)
        }
      } while (ret.code !== 200)
      await this.login()
      await this.init()
      await this.notifyMobile()
      ret = await this.getContact()
      debug('getContact data length: ', ret.length)
      this.updateContacts(ret)
    } catch (err) {
      this.emit('error', err)
      debug(err)
      this.logout()
      this.emit('logout')
      this.state = this.CONF.STATE.logout
      return
    }
    this.syncPolling(data => this.handleSync(data))
    this.emit('login')
    this.state = this.CONF.STATE.login
  }

  stop () {
    this.logout()
  }

  handleSync (data) {
    if (!data) {
      this.emit('logout')
      this.state = this.CONF.STATE.logout
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
