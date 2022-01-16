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
      this.ChatRoomName = this.FromUserName
      this.Content = this.Content.split(':<br/>')
      this.FromUserName = this.Content.shift()
      this.Content = this.Content.join(':<br/>')
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
    const time = new Date(1e3 * this.CreateTime);
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
