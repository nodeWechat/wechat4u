import {protoAugment, convertEmoji} from '../util'

/* Contact Object Example
{
  "Uin": 0,
  "UserName": "",
  "NickName": "",
  "HeadImgUrl": "",
  "ContactFlag": 3,
  "MemberCount": 0,
  "MemberList": [],
  "RemarkName": "",
  "HideInputBarFlag": 0,
  "Sex": 0,
  "Signature": "",
  "VerifyFlag": 8,
  "OwnerUin": 0,
  "PYInitial": "",
  "PYQuanPin": "",
  "RemarkPYInitial": "",
  "RemarkPYQuanPin": "",
  "StarFriend": 0,
  "AppAccountFlag": 0,
  "Statues": 0,
  "AttrStatus": 0,
  "Province": "",
  "City": "",
  "Alias": "Urinxs",
  "SnsFlag": 0,
  "UniFriend": 0,
  "DisplayName": "",
  "ChatRoomId": 0,
  "KeyWord": "gh_",
  "EncryChatRoomId": ""
}
*/
export function getUserByUserName (memberList, UserName) {
  if (!memberList.length) return null

  return memberList.find(contact => contact.UserName === UserName)
}

export function headImgUrlAugment (headImgUrl, baseUri) {
  return headImgUrl ? baseUri.match(/http.*?\/\/.*?(?=\/)/)[0] + headImgUrl : null
}

const contactProto = {
  init: function (config) {
    this.NickName = convertEmoji(this.NickName)
    this.UserName = convertEmoji(this.UserName)
    this.HeadImgUrl = headImgUrlAugment(this.HeadImgUrl, config.baseUri)
  },

  getDisplayName: function () {
    return this.RemarkName || this.NickName || ''
  }
}

export default function contactAugment (contactObj, config) {
  protoAugment(contactObj, contactProto)
  contactObj.init(config)
}
