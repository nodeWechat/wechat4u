export const CONF = {
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
  MSGTYPE_GROUP_NOTIFY: 10000,
  MSGTYPE_RECALLED: 10002,

  SYNCCHECK_RET_SUCCESS: 0,
  SYNCCHECK_SELECTOR_NORMAL: 0,
  SYNCCHECK_SELECTOR_MSG: 2,
  SYNCCHECK_SELECTOR_MOBILEOPEN: 7,

  oplogCmdId: {
    TOPCONTACT: 3,
    MODREMARKNAME: 2
  },
  SP_CONTACT_FILE_HELPER: 'filehelper',
  SP_CONTACT_NEWSAPP: 'newsapp',
  SP_CONTACT_RECOMMEND_HELPER: 'fmessage',

  CONTACTFLAG_CONTACT: 1,
  CONTACTFLAG_CHATCONTACT: 2,
  CONTACTFLAG_CHATROOMCONTACT: 4,
  CONTACTFLAG_BLACKLISTCONTACT: 8,
  CONTACTFLAG_DOMAINCONTACT: 16,
  CONTACTFLAG_HIDECONTACT: 32,
  CONTACTFLAG_FAVOURCONTACT: 64,
  CONTACTFLAG_3RDAPPCONTACT: 128,
  CONTACTFLAG_SNSBLACKLISTCONTACT: 256,
  CONTACTFLAG_NOTIFYCLOSECONTACT: 512,
  CONTACTFLAG_TOPCONTACT: 2048,
  MM_USERATTRVERIFYFALG_BIZ: 1,
  MM_USERATTRVERIFYFALG_FAMOUS: 2,
  MM_USERATTRVERIFYFALG_BIZ_BIG: 4,
  MM_USERATTRVERIFYFALG_BIZ_BRAND: 8,
  MM_USERATTRVERIFYFALG_BIZ_VERIFIED: 16,
  MM_DATA_TEXT: 1,
  MM_DATA_HTML: 2,
  MM_DATA_IMG: 3,
  MM_DATA_PRIVATEMSG_TEXT: 11,
  MM_DATA_PRIVATEMSG_HTML: 12,
  MM_DATA_PRIVATEMSG_IMG: 13,
  MM_DATA_VOICEMSG: 34,
  MM_DATA_PUSHMAIL: 35,
  MM_DATA_QMSG: 36,
  MM_DATA_VERIFYMSG: 37,
  MM_DATA_PUSHSYSTEMMSG: 38,
  MM_DATA_QQLIXIANMSG_IMG: 39,
  MM_DATA_POSSIBLEFRIEND_MSG: 40,
  MM_DATA_SHARECARD: 42,
  MM_DATA_VIDEO: 43,
  MM_DATA_VIDEO_IPHONE_EXPORT: 44,
  MM_DATA_EMOJI: 47,
  MM_DATA_LOCATION: 48,
  MM_DATA_APPMSG: 49,
  MM_DATA_VOIPMSG: 50,
  MM_DATA_STATUSNOTIFY: 51,
  MM_DATA_VOIPNOTIFY: 52,
  MM_DATA_VOIPINVITE: 53,
  MM_DATA_MICROVIDEO: 62,
  MM_DATA_SYSNOTICE: 9999,
  MM_DATA_SYS: 1e4,
  MM_DATA_RECALLED: 10002,

  MSG_SEND_STATUS_READY: 0,
  MSG_SEND_STATUS_SENDING: 1,
  MSG_SEND_STATUS_SUCC: 2,
  MSG_SEND_STATUS_FAIL: 5,
  APPMSGTYPE_TEXT: 1,
  APPMSGTYPE_IMG: 2,
  APPMSGTYPE_AUDIO: 3,
  APPMSGTYPE_VIDEO: 4,
  APPMSGTYPE_URL: 5,
  APPMSGTYPE_ATTACH: 6,
  APPMSGTYPE_OPEN: 7,
  APPMSGTYPE_EMOJI: 8,
  APPMSGTYPE_VOICE_REMIND: 9,
  APPMSGTYPE_SCAN_GOOD: 10,
  APPMSGTYPE_GOOD: 13,
  APPMSGTYPE_EMOTION: 15,
  APPMSGTYPE_CARD_TICKET: 16,
  APPMSGTYPE_REALTIME_SHARE_LOCATION: 17,
  APPMSGTYPE_TRANSFERS: 2e3,
  APPMSGTYPE_RED_ENVELOPES: 2001,
  APPMSGTYPE_READER_TYPE: 100001,
  UPLOAD_MEDIA_TYPE_IMAGE: 1,
  UPLOAD_MEDIA_TYPE_VIDEO: 2,
  UPLOAD_MEDIA_TYPE_AUDIO: 3,
  UPLOAD_MEDIA_TYPE_ATTACHMENT: 4,
  PROFILE_BITFLAG_NOCHANGE: 0,
  PROFILE_BITFLAG_CHANGE: 190,
  CHATROOM_NOTIFY_OPEN: 1,
  CHATROOM_NOTIFY_CLOSE: 0,
  StatusNotifyCode_READED: 1,
  StatusNotifyCode_ENTER_SESSION: 2,
  StatusNotifyCode_INITED: 3,
  StatusNotifyCode_SYNC_CONV: 4,
  StatusNotifyCode_QUIT_SESSION: 5,
  VERIFYUSER_OPCODE_ADDCONTACT: 1,
  VERIFYUSER_OPCODE_SENDREQUEST: 2,
  VERIFYUSER_OPCODE_VERIFYOK: 3,
  VERIFYUSER_OPCODE_VERIFYREJECT: 4,
  VERIFYUSER_OPCODE_SENDERREPLY: 5,
  VERIFYUSER_OPCODE_RECVERREPLY: 6,
  ADDSCENE_PF_QQ: 4,
  ADDSCENE_PF_EMAIL: 5,
  ADDSCENE_PF_CONTACT: 6,
  ADDSCENE_PF_WEIXIN: 7,
  ADDSCENE_PF_GROUP: 8,
  ADDSCENE_PF_UNKNOWN: 9,
  ADDSCENE_PF_MOBILE: 10,
  ADDSCENE_PF_WEB: 33,
  TIMEOUT_SYNC_CHECK: 0,
  EMOJI_FLAG_GIF: 2,
  KEYCODE_BACKSPACE: 8,
  KEYCODE_ENTER: 13,
  KEYCODE_SHIFT: 16,
  KEYCODE_ESC: 27,
  KEYCODE_DELETE: 34,
  KEYCODE_ARROW_LEFT: 37,
  KEYCODE_ARROW_UP: 38,
  KEYCODE_ARROW_RIGHT: 39,
  KEYCODE_ARROW_DOWN: 40,
  KEYCODE_NUM2: 50,
  KEYCODE_AT: 64,
  KEYCODE_NUM_ADD: 107,
  KEYCODE_NUM_MINUS: 109,
  KEYCODE_ADD: 187,
  KEYCODE_MINUS: 189,
  MM_NOTIFY_CLOSE: 0,
  MM_NOTIFY_OPEN: 1,
  MM_SOUND_CLOSE: 0,
  MM_SOUND_OPEN: 1,
  MM_SEND_FILE_STATUS_QUEUED: 0,
  MM_SEND_FILE_STATUS_SENDING: 1,
  MM_SEND_FILE_STATUS_SUCCESS: 2,
  MM_SEND_FILE_STATUS_FAIL: 3,
  MM_SEND_FILE_STATUS_CANCEL: 4,
  MM_EMOTICON_WEB: '_web',

  SPECIALUSERS: ['newsapp', 'fmessage', 'filehelper', 'weibo', 'qqmail', 'fmessage', 'tmessage', 'qmessage', 'qqsync', 'floatbottle', 'lbsapp', 'shakeapp', 'medianote', 'qqfriend', 'readerapp', 'blogapp', 'facebookapp', 'masssendapp', 'meishiapp', 'feedsapp', 'voip', 'blogappweixin', 'weixin', 'brandsessionholder', 'weixinreminder', 'wxid_novlwrv3lqwv11', 'gh_22b87fa7cb3c', 'officialaccounts', 'notification_messages', 'wxid_novlwrv3lqwv11', 'gh_22b87fa7cb3c', 'wxitil', 'userexperience_alarm', 'notification_messages']
}

export function updateAPI (API) {
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
  API.webwxsendmsgvedio = e + '/webwxsendvideomsg'
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
