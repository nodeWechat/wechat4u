import {CONF, protoAugment, convertEmoji} from '../util'

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

export function getDisplayName (contact) {
  return (contact.RemarkName && contact.RemarkName[0] !== '@')
    ? contact.RemarkName : contact.NickName || ''
}

export function headImgUrlAugment (headImgUrl, baseUri) {
  return headImgUrl ? baseUri.match(/http.*?\/\/.*?(?=\/)/)[0] + headImgUrl : null
}

export function isRoomContact (contact) {
  return contact.UserName ? /^@@|@chatroom$/.test(contact.UserName) : false
}

export function isSpContact (contact) {
  return CONF.SPECIALUSERS.indexOf(contact.UserName) >= 0
}

export function isPublicContact (contact) {
  return contact.VerifyFlag & CONF.MM_USERATTRVERIFYFALG_BIZ_BRAND
}

const contactProto = {
  init: function (instance) {
    this.NickName = convertEmoji(this.NickName)
    this.RemarkName = convertEmoji(this.UserName)
    this.AvatarUrl = headImgUrlAugment(this.HeadImgUrl, instance.baseUri)

    this.isSelf = this.UserName === instance.user.UserName

    return this
  },
  getDisplayName: function () {
    return getDisplayName(this)
  },
  canSearch: function (keyword) {
    if (!keyword) return false
    keyword = keyword.toUpperCase()

    let isSatisfy = key => (key || '').toUpperCase().indexOf(keyword) >= 0
    return (
      isSatisfy(this.RemarkName) ||
      isSatisfy(this.RemarkPYQuanPin) ||
      isSatisfy(this.NickName) ||
      isSatisfy(this.PYQuanPin) ||
      isSatisfy(this.Alias) ||
      isSatisfy(this.KeyWord)
    )
  }
}

export default function ContactFactory (instance) {
  return {
    extend: function (contactObj) {
      protoAugment(contactObj, contactProto)
      return contactObj.init(instance)
    },
    getUserByUserName: function (UserName) {
      return getUserByUserName(instance.memberList, UserName)
    },
    getSearchUser: function (keyword) {
      return instance.memberList.filter(contact => contact.canSearch(keyword))
    },
    isSelf: function (contact) {
      return contact.isSelf || contact.UserName === instance.user.UserName
    },
    getDisplayName,
    isRoomContact,
    isPublicContact,
    isSpContact
  }
}
