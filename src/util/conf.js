'use strict'

export const CONF = {
  LANG: 'zh-CN',
  EMOTICON_REG: 'img\\sclass="(qq)?emoji (qq)?emoji([\\da-f]*?)"\\s(text="[^<>(\\s]*")?\\s?src="[^<>(\\s]*"\\s*',
  RES_PATH: '/zh_CN/htmledition/v2/',
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

  SYNCCHECK_RET_SUCCESS: 0,
  SYNCCHECK_RET_LOGOUT: 1101,
  SYNCCHECK_SELECTOR_NORMAL: 0,
  SYNCCHECK_SELECTOR_MSG: 2,
  SYNCCHECK_SELECTOR_MOBILEOPEN: 7,
  STATE: {
    init: 'init',
    uuid: 'uuid',
    login: 'login',
    logout: 'logout'
  },
  SPECIALUSERS: ['newsapp', 'fmessage', 'filehelper', 'weibo', 'qqmail', 'fmessage', 'tmessage',
    'qmessage', 'qqsync', 'floatbottle', 'lbsapp', 'shakeapp', 'medianote', 'qqfriend',
    'readerapp', 'blogapp', 'facebookapp', 'masssendapp', 'meishiapp', 'feedsapp', 'voip',
    'blogappweixin', 'weixin', 'brandsessionholder', 'weixinreminder', 'wxid_novlwrv3lqwv11',
    'gh_22b87fa7cb3c', 'officialaccounts', 'notification_messages', 'wxid_novlwrv3lqwv11',
    'gh_22b87fa7cb3c', 'wxitil', 'userexperience_alarm', 'notification_messages'
  ]
}

export function getCONF (host) {
  host = host || 'wx.qq.com'
  let origin = `https://${host}`
  let loginUrl = 'login.wx.qq.com'
  let fileUrl = 'file.wx.qq.com'
  let pushUrl = 'webpush.weixin.qq.com'
  let matchResult = host.match(/(\w+)(.qq.com|.wechat.com)/)
  if (matchResult && matchResult[1] && matchResult[2]) {
    let prefix = matchResult[1]
    let suffix = matchResult[2]
    if (suffix === '.qq.com') {
      prefix = ~['wx', 'wx2', 'wx8'].indexOf(prefix) ? prefix : 'wx'
    } else {
      prefix = ~['web', 'web2'].indexOf(prefix) ? prefix : 'web'
    }
    loginUrl = `login.${prefix}${suffix}`
    fileUrl = `file.${prefix}${suffix}`
    pushUrl = `webpush.${prefix}${suffix}`
  }
  let conf = {}
  conf.origin = origin
  conf.baseUri = origin + '/cgi-bin/mmwebwx-bin'
  conf.API_jsLogin = 'https://' + loginUrl + '/jslogin?appid=wx782c26e4c19acffb&fun=new&lang=zh-CN&redirect_uri=https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?mod=desktop'
  conf.API_login = 'https://' + loginUrl + '/cgi-bin/mmwebwx-bin/login'
  conf.API_synccheck = 'https://' + pushUrl + '/cgi-bin/mmwebwx-bin/synccheck'
  conf.API_webwxdownloadmedia = 'https://' + fileUrl + '/cgi-bin/mmwebwx-bin/webwxgetmedia'
  conf.API_webwxuploadmedia = 'https://' + fileUrl + '/cgi-bin/mmwebwx-bin/webwxuploadmedia'
  conf.API_webwxpreview = origin + '/cgi-bin/mmwebwx-bin/webwxpreview'
  conf.API_webwxinit = origin + '/cgi-bin/mmwebwx-bin/webwxinit'
  conf.API_webwxgetcontact = origin + '/cgi-bin/mmwebwx-bin/webwxgetcontact'
  conf.API_webwxsync = origin + '/cgi-bin/mmwebwx-bin/webwxsync'
  conf.API_webwxbatchgetcontact = origin + '/cgi-bin/mmwebwx-bin/webwxbatchgetcontact'
  conf.API_webwxgeticon = origin + '/cgi-bin/mmwebwx-bin/webwxgeticon'
  conf.API_webwxsendmsg = origin + '/cgi-bin/mmwebwx-bin/webwxsendmsg'
  conf.API_webwxsendmsgimg = origin + '/cgi-bin/mmwebwx-bin/webwxsendmsgimg'
  conf.API_webwxsendmsgvedio = origin + '/cgi-bin/mmwebwx-bin/webwxsendvideomsg'
  conf.API_webwxsendemoticon = origin + '/cgi-bin/mmwebwx-bin/webwxsendemoticon'
  conf.API_webwxsendappmsg = origin + '/cgi-bin/mmwebwx-bin/webwxsendappmsg'
  conf.API_webwxgetheadimg = origin + '/cgi-bin/mmwebwx-bin/webwxgetheadimg'
  conf.API_webwxgetmsgimg = origin + '/cgi-bin/mmwebwx-bin/webwxgetmsgimg'
  conf.API_webwxgetmedia = origin + '/cgi-bin/mmwebwx-bin/webwxgetmedia'
  conf.API_webwxgetvideo = origin + '/cgi-bin/mmwebwx-bin/webwxgetvideo'
  conf.API_webwxlogout = origin + '/cgi-bin/mmwebwx-bin/webwxlogout'
  conf.API_webwxgetvoice = origin + '/cgi-bin/mmwebwx-bin/webwxgetvoice'
  conf.API_webwxupdatechatroom = origin + '/cgi-bin/mmwebwx-bin/webwxupdatechatroom'
  conf.API_webwxcreatechatroom = origin + '/cgi-bin/mmwebwx-bin/webwxcreatechatroom'
  conf.API_webwxstatusnotify = origin + '/cgi-bin/mmwebwx-bin/webwxstatusnotify'
  conf.API_webwxcheckurl = origin + '/cgi-bin/mmwebwx-bin/webwxcheckurl'
  conf.API_webwxverifyuser = origin + '/cgi-bin/mmwebwx-bin/webwxverifyuser'
  conf.API_webwxfeedback = origin + '/cgi-bin/mmwebwx-bin/webwxsendfeedback'
  conf.API_webwxreport = origin + '/cgi-bin/mmwebwx-bin/webwxstatreport'
  conf.API_webwxsearch = origin + '/cgi-bin/mmwebwx-bin/webwxsearchcontact'
  conf.API_webwxoplog = origin + '/cgi-bin/mmwebwx-bin/webwxoplog'
  conf.API_checkupload = origin + '/cgi-bin/mmwebwx-bin/webwxcheckupload'
  conf.API_webwxrevokemsg = origin + '/cgi-bin/mmwebwx-bin/webwxrevokemsg'
  return Object.assign(conf, CONF)
}
