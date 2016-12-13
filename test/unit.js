/* eslint-env node, mocha */
import {expect} from 'chai'

import * as util from '../src/util'
import MessageFactory from '../src/interface/message'
import ContactFactory, * as contactMethod from '../src/interface/contact'

describe('Util', () => {
  it('is not browser', () => {
    expect(util.isStandardBrowserEnv).to.equal(false)
  })

  it('is function', () => {
    expect(util.isFunction(() => {})).to.equal(true)
    expect(util.isFunction(null)).to.equal(false)
  })

  it('convert emoji method', () => {
    expect(util.convertEmoji('<span class="emoji emoji(0000)"></span>').charCodeAt()).to.equal(42)
    expect(util.convertEmoji('')).to.equal('')
    expect(util.convertEmoji(undefined)).to.equal('')
  })

  it('format num', () => {
    expect(util.formatNum(0, 2)).to.equal('00')
    expect(util.formatNum(2, 2)).to.equal('02')
    expect(util.formatNum(20, 2)).to.equal('20')
  })
})

describe('Message interface', () => {
  describe('Message: ', () => {
    let immutNewMessage1 = {
      FromUserName: 'test',
      Content: '&lt;a&gt;<br/>bc'
    }

    let immutNewMessage2 = {
      FromUserName: '123',
      Content: '&lt;a&gt;<br/>bc'
    }

    let Message
    let newMessage1
    let newMessage2

    beforeEach(() => {
      Message = MessageFactory({user: {UserName: 'test'}})
      newMessage1 = Message.extend(immutNewMessage1)
      newMessage2 = Message.extend(immutNewMessage2)
    })

    it('property stable', () => {
      expect(newMessage1.FromUserName).to.equal('test')
    })

    it('content parse', () => {
      expect(newMessage1.Content).to.equal('<a>\nbc')
    })

    it('isSendBySelf', () => {
      expect(newMessage1.isSendBySelf).to.equal(true)
      expect(newMessage2.isSendBySelf).to.equal(false)
    })

    it('isSendBy', () => {
      expect(newMessage2.isSendBy({UserName: '123'})).to.equal(true)
      expect(newMessage2.isSendBy({UserName: 'test'})).to.equal(false)
    })
  })
})

describe('Contact interface: ', () => {
  describe('method: ', () => {
    it('get user by UserName', () => {
      var user = {UserName: 'test'}
      var list = [user]

      expect(contactMethod.getUserByUserName(list, 'test')).to.equal(user)
    })

    it('is room contact', () => {
      expect(contactMethod.isRoomContact({UserName: '@@123'})).to.equal(true)
      expect(contactMethod.isRoomContact({UserName: '123'})).to.equal(false)
    })
  })

  describe('Contact: ', () => {
    let immutUser1 = {
      UserName: 'test',
      NickName: 'test',
      HeadImgUrl: '/test'
    }

    let immutUser2 = {
      UserName: '@@test',
      NickName: 'test',
      HeadImgUrl: '/test'
    }

    let immutInstance = {
      user: immutUser1,
      baseUri: 'https://wx2.qq.com/',
      contacts: {}
    }

    let Contact
    let instance

    beforeEach(() => {
      instance = Object.assign({}, immutInstance)

      Contact = ContactFactory(instance)

      instance.contacts[immutUser1.UserName] = Contact.extend(immutUser1)
      instance.contacts[immutUser2.UserName] = Contact.extend(immutUser2)
    })

    it('property stable', () => {
      const user1 = instance.contacts[immutUser1.UserName]
      expect(user1.NickName).to.equal('test')
    })

    it('getDisplayName', () => {
      const user1 = instance.contacts[immutUser1.UserName]
      expect(user1.getDisplayName()).to.equal('test')
    })

    it('can search', () => {
      const user1 = instance.contacts[immutUser1.UserName]
      const user2 = instance.contacts[immutUser2.UserName]
      expect(user1.canSearch('te')).to.equal(true)
      expect(user2.canSearch('123')).to.equal(false)
    })

    it('isSelf', () => {
      const user1 = instance.contacts[immutUser1.UserName]
      const user2 = instance.contacts[immutUser2.UserName]
      expect(user1.isSelf).to.equal(true)
      expect(user2.isSelf).to.equal(false)
    })

    it('get user by username', () => {
      const user1 = instance.contacts[immutUser1.UserName]
      expect(Contact.getUserByUserName('test')).to.equal(user1)
    })

    it('get search user', () => {
      const user1 = instance.contacts[immutUser1.UserName]
      expect(Contact.getSearchUser('te')[0]).to.equal(user1)
      expect(Contact.getSearchUser('123').length).to.equal(0)
    })

    it('isRoomContact', () => {
      const user1 = instance.contacts[immutUser1.UserName]
      const user2 = instance.contacts[immutUser2.UserName]
      expect(Contact.isRoomContact(user2)).to.equal(true)
      expect(Contact.isRoomContact(user1)).to.equal(false)
    })
  })
})
