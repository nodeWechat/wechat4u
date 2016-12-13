import path from 'path'
import bl from 'bl'
import _debug from 'debug'
import FormData from 'form-data'
import mime from 'mime'
import {
  getCONF,
  Request,
  isStandardBrowserEnv,
  assert,
  getClientMsgId,
  getDeviceID
} from './util'

const debug = _debug('core')

export default class WechatCore {

  constructor () {
    this.PROP = {
      uuid: '',
      uin: '',
      sid: '',
      skey: '',
      passTicket: '',
      formatedSyncKey: '',
      webwxDataTicket: '',
      syncKey: {
        List: []
      }
    }

    this.CONF = getCONF()
    this.user = {}
    this.mediaSend = 0
    this.request = new Request()
  }

  getUUID () {
    return Promise.resolve().then(() => {
      return this.request({
        method: 'POST',
        url: this.CONF.API_jsLogin
      }).then(res => {
        let window = {
          QRLogin: {}
        }
        // res.data: "window.QRLogin.code = xxx; ..."
        // eslint-disable-next-line
        eval(res.data)
        assert.equal(window.QRLogin.code, 200, res)

        this.PROP.uuid = window.QRLogin.uuid
        return window.QRLogin.uuid
      })
    }).catch(err => {
      debug(err)
      throw new Error('获取UUID失败')
    })
  }

  checkLogin () {
    return Promise.resolve().then(() => {
      let params = {
        'tip': 0,
        'uuid': this.PROP.uuid,
        'loginicon': true
      }
      return this.request({
        method: 'GET',
        url: this.CONF.API_login,
        params: params
      }).then(res => {
        let window = {}

        // eslint-disable-next-line
        eval(res.data)
        assert.notEqual(window.code, 400, res)

        if (window.code === 200) {
          this.CONF = getCONF(window.redirect_uri.match(/(?:\w+\.)+\w+/)[0])
          this.rediUri = window.redirect_uri
        } else if (window.code === 201 && window.userAvatar) {
          this.user.userAvatar = window.userAvatar
        }
        return window
      })
    }).catch(err => {
      debug(err)
      throw new Error('获取手机确认登录信息失败')
    })
  }

  login () {
    return Promise.resolve().then(() => {
      return this.request({
        method: 'GET',
        url: this.rediUri,
        params: {
          fun: 'new'
        }
      }).then(res => {
        let pm = res.data.match(/<ret>(.*)<\/ret>/)
        if (pm && pm[1] === 0) {
          this.PROP.skey = res.data.match(/<skey>(.*)<\/skey>/)[1]
          this.PROP.sid = res.data.match(/<wxsid>(.*)<\/wxsid>/)[1]
          this.PROP.uin = res.data.match(/<wxuin>(.*)<\/wxuin>/)[1]
          this.PROP.passTicket = res.data.match(/<pass_ticket>(.*)<\/pass_ticket>/)[1]
        }
        if (res.headers['set-cookie']) {
          res.headers['set-cookie'].forEach(item => {
            if (/webwx.*?data.*?ticket/i.test(item)) {
              this.PROP.webwxDataTicket = item.match(/=(.*?);/)[1]
            } else if (/wxuin/i.test(item)) {
              this.PROP.uin = item.match(/=(.*?);/)[1]
            } else if (/wxsid/i.test(item)) {
              this.PROP.sid = item.match(/=(.*?);/)[1]
            }
          })
        }
      })
    }).catch(err => {
      debug(err)
      throw new Error('登录失败')
    })
  }

  init () {
    return Promise.resolve().then(() => {
      let params = {
        'pass_ticket': this.PROP.passTicket,
        'skey': this.PROP.skey,
        'r': ~new Date()
      }
      let data = {
        BaseRequest: this.getBaseRequest()
      }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxinit,
        params: params,
        data: data
      }).then(res => {
        let data = res.data
        assert.equal(data.BaseResponse.Ret, 0, res)
        this.PROP.skey = data.SKey || this.PROP.skey
        this.updateSyncKey(data)
        Object.assign(this.user, data.User)
        return this.user
      })
    }).catch(err => {
      debug(err)
      throw new Error('微信初始化失败')
    })
  }

  notifyMobile (to) {
    return Promise.resolve().then(() => {
      let params = {
        pass_ticket: this.PROP.passTicket,
        lang: 'zh_CN'
      }
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'Code': to ? 1 : 3,
        'FromUserName': this.user['UserName'],
        'ToUserName': to || this.user['UserName'],
        'ClientMsgId': getClientMsgId()
      }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxstatusnotify,
        params: params,
        data: data
      }).then(res => {
        let data = res.data
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('手机状态通知失败')
    })
  }

  getContact () {
    return Promise.resolve().then(() => {
      let params = {
        'lang': 'zh_CN',
        'pass_ticket': this.PROP.passTicket,
        'seq': 0,
        'skey': this.PROP.skey,
        'r': +new Date()
      }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxgetcontact,
        params: params
      }).then(res => {
        let data = res.data
        assert.equal(data.BaseResponse.Ret, 0, res)

        return data.MemberList
      })
    }).catch(err => {
      debug(err)
      throw new Error('获取通讯录失败')
    })
  }

  batchGetContact (contacts) {
    return Promise.resolve().then(() => {
      let params = {
        'pass_ticket': this.PROP.passTicket,
        'type': 'ex',
        'r': +new Date(),
        'lang': 'zh_CN'
      }
      let data = {
        'BaseRequest': this.getBaseRequest(),
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
        assert.equal(data.BaseResponse.Ret, 0, res)

        return data.ContactList
      })
    }).catch(err => {
      debug(err)
      throw new Error('批量获取联系人失败')
    })
  }

  statReport (text) {
    return Promise.resolve().then(() => {
      text = text || {
        'type': '[action-record]',
        'data': {
          'actions': [{
            'type': 'click',
            'action': '发送框',
            'time': +new Date()
          }]
        }
      }
      text = JSON.stringify(text)
      let params = {
        'pass_ticket': this.PROP.passTicket,
        'fun': 'new',
        'lang': 'zh_CN'
      }
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'Count': 1,
        'List': [{
          'Text': text,
          'Type': 1
        }]
      }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxreport,
        params: params,
        data: data
      })
    }).catch(err => {
      debug(err)
      throw new Error('状态报告失败')
    })
  }

  syncCheck () {
    return Promise.resolve().then(() => {
      let params = {
        'r': +new Date(),
        'sid': this.PROP.sid,
        'uin': this.PROP.uin,
        'skey': this.PROP.skey,
        'deviceid': getDeviceID(),
        'synckey': this.PROP.formatedSyncKey
      }
      return this.request({
        method: 'GET',
        url: this.CONF.API_synccheck,
        params: params
      }).then(res => {
        let window = {
          synccheck: {}
        }

        // eslint-disable-next-line
        eval(res.data)
        assert.equal(window.synccheck.retcode, this.CONF.SYNCCHECK_RET_SUCCESS, res)

        return window.synccheck.selector
      })
    }).catch(err => {
      debug(err)
      throw new Error('同步失败')
    })
  }

  sync () {
    return Promise.resolve().then(() => {
      let params = {
        'sid': this.PROP.sid,
        'skey': this.PROP.skey,
        'pass_ticket': this.PROP.passTicket,
        'lang': 'zh_CN'
      }
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'SyncKey': this.PROP.syncKey,
        'rr': ~new Date()
      }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxsync,
        params: params,
        data: data
      }).then(res => {
        let data = res.data
        assert.equal(data.BaseResponse.Ret, 0, res)

        this.updateSyncKey(data)
        this.PROP.skey = data.SKey || this.PROP.skey
        return data
      })
    }).catch(err => {
      debug(err)
      throw new Error('获取新信息失败')
    })
  }

  updateSyncKey (data) {
    if (data.SyncKey) {
      this.PROP.syncKey = data.SyncKey
    }
    if (data.SyncCheckKey) {
      let synckeylist = []
      for (let e = data.SyncCheckKey.List, o = 0, n = e.length; n > o; o++) {
        synckeylist.push(e[o]['Key'] + '_' + e[o]['Val'])
      }
      this.PROP.formatedSyncKey = synckeylist.join('|')
    } else if (!this.PROP.formatedSyncKey && data.SyncKey) {
      let synckeylist = []
      for (let e = data.SyncKey.List, o = 0, n = e.length; n > o; o++) {
        synckeylist.push(e[o]['Key'] + '_' + e[o]['Val'])
      }
      this.PROP.formatedSyncKey = synckeylist.join('|')
    }
  }

  logout () {
    return Promise.resolve().then(() => {
      let params = {
        redirect: 1,
        type: 0,
        skey: this.PROP.skey,
        lang: 'zh_CN'
      }

      // data加上会出错，不加data也能登出
      // let data = {
      //   sid: this.PROP.sid,
      //   uin: this.PROP.uin
      // }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxlogout,
        params: params
      }).then(res => {
        return '登出成功'
      }).catch(err => {
        debug(err)
        return '可能登出成功'
      })
    })
  }

  sendMsg (msg, to) {
    return this.sendText(msg, to)
  }

  sendText (msg, to) {
    return Promise.resolve().then(() => {
      let params = {
        'pass_ticket': this.PROP.passTicket,
        'lang': 'zh_CN'
      }
      let clientMsgId = getClientMsgId()
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'Scene': 0,
        'Msg': {
          'Type': this.CONF.MSGTYPE_TEXT,
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
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('发送文本信息失败')
    })
  }

  sendEmoticon (id, to) {
    return Promise.resolve().then(() => {
      let params = {
        'fun': 'sys',
        'pass_ticket': this.PROP.passTicket,
        'lang': 'zh_CN'
      }
      let clientMsgId = getClientMsgId()
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'Scene': 0,
        'Msg': {
          'Type': this.CONF.MSGTYPE_EMOTICON,
          'EmojiFlag': 2,
          'FromUserName': this.user['UserName'],
          'ToUserName': to,
          'LocalID': clientMsgId,
          'ClientMsgId': clientMsgId
        }
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
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('发送表情信息失败')
    })
  }

  // file: Stream, Buffer, File
  uploadMedia (file, filename) {
    return Promise.resolve().then(() => {
      let name, type, size, ext, mediatype, data
      return new Promise((resolve, reject) => {
        if (isStandardBrowserEnv) {
          name = file.name
          type = file.type
          size = file.size
          data = file
          return resolve()
        } else if (Buffer.isBuffer(file)) {
          if (!filename) {
            return reject(new Error('文件名未知'))
          }
          name = filename
          type = mime.lookup(name)
          size = file.length
          data = file
          return resolve()
        } else if (file.readable) {
          if (!file.path && !filename) {
            return reject(new Error('文件名未知'))
          }
          name = path.basename(file.path || filename)
          type = mime.lookup(name)
          file.pipe(bl((err, buffer) => {
            if (err) {
              return reject(err)
            }
            size = buffer.length
            data = buffer
            return resolve()
          }))
        }
      }).then(() => {
        ext = name.match(/.*\.(.*)/)
        if (ext) {
          ext = ext[1]
        }

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

        let clientMsgId = getClientMsgId()

        let uploadMediaRequest = JSON.stringify({
          BaseRequest: this.getBaseRequest(),
          ClientMediaId: clientMsgId,
          TotalLen: size,
          StartPos: 0,
          DataLen: size,
          MediaType: 4,
          UploadType: 2,
          FromUserName: this.user.UserName,
          ToUserName: this.user.UserName
        })

        let form = new FormData()
        form.append('name', name)
        form.append('type', type)
        form.append('lastModifiedDate', new Date().toGMTString())
        form.append('size', size)
        form.append('mediatype', mediatype)
        form.append('uploadmediarequest', uploadMediaRequest)
        form.append('webwx_data_ticket', this.PROP.webwxDataTicket)
        form.append('pass_ticket', encodeURI(this.PROP.passTicket))
        form.append('filename', data, {
          filename: name,
          contentType: type,
          knownLength: size
        })
        return new Promise((resolve, reject) => {
          form.pipe(bl((err, buffer) => {
            if (err) {
              return reject(err)
            }
            return resolve({
              buffer: buffer,
              headers: form.getHeaders()
            })
          }))
        })
      }).then(data => {
        let params = {
          f: 'json'
        }

        return this.request({
          method: 'POST',
          url: this.CONF.API_webwxuploadmedia,
          headers: data.headers,
          params: params,
          data: data.buffer
        })
      }).then(res => {
        let data = res.data
        let mediaId = data.MediaId
        assert.ok(mediaId, res)

        return {
          name: name,
          size: size,
          ext: ext,
          mediatype: mediatype,
          mediaId: mediaId
        }
      })
    }).catch(err => {
      debug(err)
      throw new Error('上传媒体文件失败')
    })
  }

  sendPic (mediaId, to) {
    return Promise.resolve().then(() => {
      let params = {
        'pass_ticket': this.PROP.passTicket,
        'fun': 'async',
        'f': 'json',
        'lang': 'zh_CN'
      }
      let clientMsgId = getClientMsgId()
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'Scene': 0,
        'Msg': {
          'Type': this.CONF.MSGTYPE_IMAGE,
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
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('发送图片失败')
    })
  }

  sendVideo (mediaId, to) {
    return Promise.resolve().then(() => {
      let params = {
        'pass_ticket': this.PROP.passTicket,
        'fun': 'async',
        'f': 'json',
        'lang': 'zh_CN'
      }
      let clientMsgId = getClientMsgId()
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'Scene': 0,
        'Msg': {
          'Type': this.CONF.MSGTYPE_VIDEO,
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
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('发送视频失败')
    })
  }

  sendDoc (mediaId, name, size, ext, to) {
    return Promise.resolve().then(() => {
      let params = {
        'pass_ticket': this.PROP.passTicket,
        'fun': 'async',
        'f': 'json',
        'lang': 'zh_CN'
      }
      let clientMsgId = getClientMsgId()
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'Scene': 0,
        'Msg': {
          'Type': this.CONF.APPMSGTYPE_ATTACH,
          'Content': `<appmsg appid='wxeb7ec651dd0aefa9' sdkver=''><title>${name}</title><des></des><action></action><type>6</type><content></content><url></url><lowurl></lowurl><appattach><totallen>${size}</totallen><attachid>${mediaId}</attachid><fileext>${ext}</fileext></appattach><extinfo></extinfo></appmsg>`,
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
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('发送文件失败')
    })
  }

  getMsgImg (msgId) {
    return Promise.resolve().then(() => {
      let params = {
        MsgID: msgId,
        skey: this.PROP.skey,
        type: 'big'
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
      })
    }).catch(err => {
      debug(err)
      throw new Error('获取图片或表情失败')
    })
  }

  getVideo (msgId) {
    return Promise.resolve().then(() => {
      let params = {
        MsgID: msgId,
        skey: this.PROP.skey
      }

      return this.request({
        method: 'GET',
        url: this.CONF.API_webwxgetvideo,
        headers: {
          'Range': 'bytes=0-'
        },
        params: params,
        responseType: 'arraybuffer'
      }).then(res => {
        return {
          data: res.data,
          type: res.headers['content-type']
        }
      })
    }).catch(err => {
      debug(err)
      throw new Error('获取视频失败')
    })
  }

  getVoice (msgId) {
    return Promise.resolve().then(() => {
      let params = {
        MsgID: msgId,
        skey: this.PROP.skey
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
      })
    }).catch(err => {
      debug(err)
      throw new Error('获取声音失败')
    })
  }

  getHeadImg (HeadImgUrl) {
    return Promise.resolve().then(() => {
      let url = this.CONF.origin + HeadImgUrl
      return this.request({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
      }).then(res => {
        return {
          data: res.data,
          type: res.headers['content-type']
        }
      })
    }).catch(err => {
      debug(err)
      throw new Error('获取头像失败')
    })
  }

  verifyUser (UserName, Ticket) {
    return Promise.resolve().then(() => {
      let params = {
        'pass_ticket': this.PROP.passTicket,
        'lang': 'zh_CN'
      }
      let data = {
        'BaseRequest': this.getBaseRequest(),
        'Opcode': 3,
        'VerifyUserListSize': 1,
        'VerifyUserList': [{
          'Value': UserName,
          'VerifyUserTicket': Ticket
        }],
        'VerifyContent': '',
        'SceneListCount': 1,
        'SceneList': [33],
        'skey': this.PROP.skey
      }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxverifyuser,
        params: params,
        data: data
      }).then(res => {
        let data = res.data
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('通过好友请求失败')
    })
  }

  // fun: 'addmember' or 'delmember' or 'invitemember'
  updateChatroom (ChatRoomName, MemberList, fun) {
    return Promise.resolve().then(() => {
      let params = {
        fun: fun
      }
      let data = {
        BaseRequest: this.getBaseRequest(),
        ChatRoomName: ChatRoomName
      }
      if (fun === 'addmember') {
        data.AddMemberList = MemberList.toString()
      } else if (fun === 'delmember') {
        data.DelMemberList = MemberList.toString()
      } else if (fun === 'invitemember') {
        data.InviteMemberList = MemberList.toString()
      }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxupdatechatroom,
        params: params,
        data: data
      }).then(res => {
        let data = res.data
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('邀请或踢出群成员失败')
    })
  }

  // OP: 1 联系人置顶 0 取消置顶
  opLog (UserName, OP) {
    return Promise.resolve().then(() => {
      let params = {
        pass_ticket: this.PROP.passTicket
      }
      let data = {
        BaseRequest: this.getBaseRequest(),
        CmdId: 3,
        OP: OP,
        UserName: UserName
      }
      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxoplog,
        params: params,
        data: data
      }).then(res => {
        let data = res.data
        assert.equal(data.BaseResponse.Ret, 0, res)
      })
    }).catch(err => {
      debug(err)
      throw new Error('置顶或取消置顶失败')
    })
  }

  getBaseRequest () {
    return {
      Uin: parseInt(this.PROP.uin),
      Sid: this.PROP.sid,
      Skey: this.PROP.skey,
      DeviceID: getDeviceID()
    }
  }
}
