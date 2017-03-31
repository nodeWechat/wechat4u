import {convertEmoji, formatNum} from '../util'
/* Message Object Example
{
    "FromUserName": "",
    "ToUserName": "",
    "Content": "",
    "StatusNotifyUserName": "",
    "ImgWidth": 0,
    "PlayLength": 0,
    "RecommendInfo": {},
    "StatusNotifyCode": 4,
    "NewMsgId": "",
    "Status": 3,
    "VoiceLength": 0,
    "ForwardFlag": 0,
    "AppMsgType": 0,
    "Ticket": "",
    "AppInfo": {...},
    "Url": "",
    "ImgStatus": 1,
    "MsgType": 1,
    "ImgHeight": 0,
    "MediaId": "",
    "MsgId": "",
    "FileName": "",
    "HasProductId": 0,
    "FileSize": "",
    "CreateTime": 0,
    "SubMsgType": 0
}
*/

const messageProto = {
  init: function (instance) {
    this.MsgType = +this.MsgType
    this.isSendBySelf = this.FromUserName === instance.user.UserName || this.FromUserName === ''

    this.OriginalContent = this.Content
    if (this.FromUserName.indexOf('@@') === 0) {
      this.Content = this.Content.replace(/^@.*?(?=:)/, match => {
        let user = instance.contacts[this.FromUserName].MemberList.find(member => {
          return member.UserName === match
        })
        return user ? instance.Contact.getDisplayName(user) : match
      })
    }

    this.Content = this.Content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<br\/>/g, '\n')
    this.Content = convertEmoji(this.Content)

    return this
  },
  isSendBy: function (contact) {
    return this.FromUserName === contact.UserName
  },
  getPeerUserName: function () {
    return this.isSendBySelf ? this.ToUserName : this.FromUserName
  },
  getDisplayTime: function () {
    var time = new Date(1e3 * this.CreateTime)
    return time.getHours() + ':' + formatNum(time.getMinutes(), 2)
  }
}

export default function MessageFactory (instance) {
  return {
    extend: function (messageObj) {
      messageObj = Object.setPrototypeOf(messageObj, messageProto)
      return messageObj.init(instance)
    }
  }
}
