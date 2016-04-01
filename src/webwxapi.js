'use strict'

module.exports = (API) => {
  let e = API.baseUri,
    t = "weixin.qq.com",
    o = "file.wx.qq.com",
    n = "webpush.weixin.qq.com";
  e.indexOf("wx2.qq.com") > -1 ? (t = "weixin.qq.com", o = "file2.wx.qq.com", n = "webpush2.weixin.qq.com") : e.indexOf("qq.com") > -1 ? (t = "weixin.qq.com", o = "file.wx.qq.com", n = "webpush.weixin.qq.com") : e.indexOf("web1.wechat.com") > -1 ? (t = "wechat.com", o = "file1.wechat.com", n = "webpush1.wechat.com") : e.indexOf("web2.wechat.com") > -1 ? (t = "wechat.com", o = "file2.wechat.com", n = "webpush2.wechat.com") : e.indexOf("wechat.com") > -1 ? (t = "wechat.com", o = "file.wechat.com", n = "webpush.wechat.com") : e.indexOf("web1.wechatapp.com") > -1 ? (t = "wechatapp.com", o = "file1.wechatapp.com", n = "webpush1.wechatapp.com") : (t = "wechatapp.com", o = "file.wechatapp.com", n = "webpush.wechatapp.com")

  API.jsLogin = "https://login." + t + "/jslogin"
  API.login = "https://login." + t + "/cgi-bin/mmwebwx-bin/login"
  API.synccheck = "https://" + n + "/cgi-bin/mmwebwx-bin/synccheck"
  API.webwxdownloadmedia = "https://" + o + "/cgi-bin/mmwebwx-bin/webwxgetmedia"
  API.webwxuploadmedia = "https://" + o + "/cgi-bin/mmwebwx-bin/webwxuploadmedia"
  API.webwxpreview = e + "/webwxpreview"
  API.webwxinit = e + "/webwxinit"
  API.webwxgetcontact = e + "/webwxgetcontact"
  API.webwxsync = e + "/webwxsync"
  API.webwxbatchgetcontact = e + "/webwxbatchgetcontact"
  API.webwxgeticon = e + "/webwxgeticon"
  API.webwxsendmsg = e + "/webwxsendmsg"
  API.webwxsendmsgimg = e + "/webwxsendmsgimg"
  API.webwxsendemoticon = e + "/webwxsendemoticon"
  API.webwxsendappmsg = e + "/webwxsendappmsg"
  API.webwxgetheadimg = e + "/webwxgetheadimg"
  API.webwxgetmsgimg = e + "/webwxgetmsgimg"
  API.webwxgetmedia = e + "/webwxgetmedia"
  API.webwxgetvideo = e + "/webwxgetvideo"
  API.webwxlogout = e + "/webwxlogout"
  API.webwxgetvoice = e + "/webwxgetvoice"
  API.webwxupdatechatroom = e + "/webwxupdatechatroom"
  API.webwxcreatechatroom = e + "/webwxcreatechatroom"
  API.webwxstatusnotify = e + "/webwxstatusnotify"
  API.webwxcheckurl = e + "/webwxcheckurl"
  API.webwxverifyuser = e + "/webwxverifyuser"
  API.webwxfeedback = e + "/webwxsendfeedback"
  API.webwxreport = e + "/webwxstatreport"
  API.webwxsearch = e + "/webwxsearchcontact"
  API.webwxoplog = e + "/webwxoplog"
}
