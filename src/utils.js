'use strict'
const debug = require('debug')('utils')

const CONF = {
  STATE: {
    init: 'init',
    uuid: 'uuid',
    login: 'login',
    logout: 'logout'
  },

  MSGTYPE_TEXT: 1,
  MSGTYPE_IMAGE: 3,
  MSGTYPE_VOICE: 34,
  MSGTYPE_VIDEO: 43,
  MSGTYPE_MICROVIDEO: 62,
  MSGTYPE_EMOTICON: 47,
  MSGTYPE_APP: 49,
  MSGTYPE_VOIPMSG: 50,
  MSGTYPE_VOIPNOTIFY: 52,
  MSGTYPE_VOIPINVITE: 53,
  MSGTYPE_LOCATION: 48,
  MSGTYPE_STATUSNOTIFY: 51,
  MSGTYPE_SYSNOTICE: 9999,
  MSGTYPE_POSSIBLEFRIEND_MSG: 40,
  MSGTYPE_VERIFYMSG: 37,
  MSGTYPE_SHARECARD: 42,
  MSGTYPE_SYS: 1e4,
  MSGTYPE_RECALLED: 10002,

  SYNCCHECK_RET_SUCCESS: 0,
  SYNCCHECK_SELECTOR_NORMAL: 0,
  SYNCCHECK_SELECTOR_MSG: 2,
  SYNCCHECK_SELECTOR_MOBILEOPEN: 7,

  SPECIALUSERS: ['newsapp', 'fmessage', 'filehelper', 'weibo', 'qqmail', 'fmessage', 'tmessage', 'qmessage', 'qqsync', 'floatbottle', 'lbsapp', 'shakeapp', 'medianote', 'qqfriend', 'readerapp', 'blogapp', 'facebookapp', 'masssendapp', 'meishiapp', 'feedsapp', 'voip', 'blogappweixin', 'weixin', 'brandsessionholder', 'weixinreminder', 'wxid_novlwrv3lqwv11', 'gh_22b87fa7cb3c', 'officialaccounts', 'notification_messages', 'wxid_novlwrv3lqwv11', 'gh_22b87fa7cb3c', 'wxitil', 'userexperience_alarm', 'notification_messages']
}

const updateAPI = API => {
  let e = API.baseUri
  let t = 'weixin.qq.com'
  let o = 'file.wx.qq.com'
  let n = 'webpush.weixin.qq.com'
  e.indexOf('wx2.qq.com') > -1 ? (t = 'weixin.qq.com', o = 'file2.wx.qq.com', n = 'webpush2.weixin.qq.com') : e.indexOf('qq.com') > -1 ? (t = 'weixin.qq.com', o = 'file.wx.qq.com', n = 'webpush.weixin.qq.com') : e.indexOf('web1.wechat.com') > -1 ? (t = 'wechat.com', o = 'file1.wechat.com', n = 'webpush1.wechat.com') : e.indexOf('web2.wechat.com') > -1 ? (t = 'wechat.com', o = 'file2.wechat.com', n = 'webpush2.wechat.com') : e.indexOf('wechat.com') > -1 ? (t = 'wechat.com', o = 'file.wechat.com', n = 'webpush.wechat.com') : e.indexOf('web1.wechatapp.com') > -1 ? (t = 'wechatapp.com', o = 'file1.wechatapp.com', n = 'webpush1.wechatapp.com') : (t = 'wechatapp.com', o = 'file.wechatapp.com', n = 'webpush.wechatapp.com')

  API.jsLogin = 'https://login.' + t + '/jslogin'
  API.login = 'https://login.' + t + '/cgi-bin/mmwebwx-bin/login'
  API.synccheck = 'https://' + n + '/cgi-bin/mmwebwx-bin/synccheck'
  API.webwxdownloadmedia = 'https://' + o + '/cgi-bin/mmwebwx-bin/webwxgetmedia'
  API.webwxuploadmedia = 'https://' + o + '/cgi-bin/mmwebwx-bin/webwxuploadmedia'
  API.webwxpreview = e + '/webwxpreview'
  API.webwxinit = e + '/webwxinit'
  API.webwxgetcontact = e + '/webwxgetcontact'
  API.webwxsync = e + '/webwxsync'
  API.webwxbatchgetcontact = e + '/webwxbatchgetcontact'
  API.webwxgeticon = e + '/webwxgeticon'
  API.webwxsendmsg = e + '/webwxsendmsg'
  API.webwxsendmsgimg = e + '/webwxsendmsgimg'
  API.webwxsendemoticon = e + '/webwxsendemoticon'
  API.webwxsendappmsg = e + '/webwxsendappmsg'
  API.webwxgetheadimg = e + '/webwxgetheadimg'
  API.webwxgetmsgimg = e + '/webwxgetmsgimg'
  API.webwxgetmedia = e + '/webwxgetmedia'
  API.webwxgetvideo = e + '/webwxgetvideo'
  API.webwxlogout = e + '/webwxlogout'
  API.webwxgetvoice = e + '/webwxgetvoice'
  API.webwxupdatechatroom = e + '/webwxupdatechatroom'
  API.webwxcreatechatroom = e + '/webwxcreatechatroom'
  API.webwxstatusnotify = e + '/webwxstatusnotify'
  API.webwxcheckurl = e + '/webwxcheckurl'
  API.webwxverifyuser = e + '/webwxverifyuser'
  API.webwxfeedback = e + '/webwxsendfeedback'
  API.webwxreport = e + '/webwxstatreport'
  API.webwxsearch = e + '/webwxsearchcontact'
  API.webwxoplog = e + '/webwxoplog'
}

const convertEmoji = s => {
  return s.replace(/<span.*?class="emoji emoji(.*?)"><\/span>/g, (a, b) => {
    try {
      let s = null
      if (b.length === 4 || b.length === 5) {
        s = ['0x' + b]
      } else if (b.length === 8) {
        s = ['0x' + b.slice(0, 4), '0x' + b.slice(4, 8)]
      } else if (b.length === 10) {
        s = ['0x' + b.slice(0, 5), '0x' + b.slice(5, 10)]
      } else {
        throw new Error('unknown emoji characters')
      }
      return String.fromCodePoint.apply(null, s)
    } catch (err) {
      debug(b, err)
      return '*'
    }
  })
}

const contentPrase = s => convertEmoji(s.replace('&lt;', '<').replace('&gt;', '>').replace('<br/>', '\n'))

module.exports = {
  CONF,
  updateAPI,
  convertEmoji,
  contentPrase
}
