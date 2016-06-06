import {protoAugment, convertEmoji} from '../util'

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

export function contentPrase (s) {
  return convertEmoji(s.replace('&lt;', '<').replace('&gt;', '>').replace('<br/>', '\n'))
}

const messageProto = {
  init: function (config) {
    this.Content = contentPrase(this.Content)
  }
}

export default function messageAugment (messageObj, config) {
  protoAugment(messageObj, messageProto)
  messageObj.init(config)
}
