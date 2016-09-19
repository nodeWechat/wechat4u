/* eslint-env node, mocha */
import {expect} from 'chai'

import './nock'

import Wechat from '../src/wechat'
import * as util from '../src/util'
import MessageFactory, * as messageMethod from '../src/interface/message'
import ContactFactory, * as contactMethod from '../src/interface/contact'

describe('Util', () => {
  it('is not browser', () => {
    expect(util.isStandardBrowserEnv).to.equal(false)
  })

  it('is function', () => {
    expect(util.isFunction(() => {})).to.equal(true)
    expect(util.isFunction(null)).to.equal(false)
  })

  it('__proto__ augment method', () => {
    var a = {b: 123}
    var A = {get () { return this.b }}
    util.protoAugment(a, A)
    expect(a.get()).to.equal(123)
  })

  it('update API method', () => {
    var API = {
      baseUri: 'wx2.qq.com'
    }

    util.updateAPI(API)
    expect(API.jsLogin).to.equal('https://login.weixin.qq.com/jslogin')
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
  describe('Method: ', () => {
    it('content parse', () => {
      expect(messageMethod.contentParse('&lt;a&gt;<br/>bc')).to.equal('<a>\nbc')
    })
  })

  describe('Message: ', () => {
    let newMessage1 = {
      FromUserName: 'test',
      Content: '&lt;a&gt;<br/>bc'
    }

    let newMessage2 = {
      FromUserName: '123',
      Content: '&lt;a&gt;<br/>bc'
    }

    let Message

    beforeEach(() => {
      Message = MessageFactory({user: {UserName: 'test'}})
      Message.extend(newMessage1)
      Message.extend(newMessage2)
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

    it('head img url augment', () => {
      expect(contactMethod.headImgUrlAugment(
        '/cgi-bin/mmwebwx-bin/webwxgeticon?seq=620802813&username=@7f504ff04e223e8cda9ece47f040c6b7&skey=@crypt_8e4ad7fa_2703a47aaf8cd4d3e61b855795e38568',
        'https://wx2.qq.com/'
      )).to.equal('https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgeticon?seq=620802813&username=@7f504ff04e223e8cda9ece47f040c6b7&skey=@crypt_8e4ad7fa_2703a47aaf8cd4d3e61b855795e38568')

      expect(contactMethod.headImgUrlAugment(
        undefined,
        'https://wx2.qq.com/'
      )).to.equal(null)
    })

    it('is room contact', () => {
      expect(contactMethod.isRoomContact({UserName: '@@123'})).to.equal(true)
      expect(contactMethod.isRoomContact({UserName: '123'})).to.equal(false)
    })
  })

  describe('Contact: ', () => {
    let user1 = {
      UserName: 'test',
      NickName: 'test',
      HeadImgUrl: '/test'
    }

    let user2 = {
      UserName: '@@test',
      NickName: 'test',
      HeadImgUrl: '/test'
    }

    let Contact

    beforeEach(() => {
      let instance = {
        user: user1,
        baseUri: 'https://wx2.qq.com/',
        contacts: {}
      }

      instance.contacts[user1.UserName] = user1
      instance.contacts[user2.UserName] = user2

      Contact = ContactFactory(instance)

      Contact.extend(user1)
      Contact.extend(user2)
    })

    it('property stable', () => {
      expect(user1.NickName).to.equal('test')
    })

    it('getDisplayName', () => {
      expect(user1.getDisplayName()).to.equal('test')
    })

    it('avatar url', () => {
      expect(user1.AvatarUrl).to.equal('https://wx2.qq.com/test')
    })

    it('can search', () => {
      expect(user1.canSearch('te')).to.equal(true)
      expect(user2.canSearch('123')).to.equal(false)
    })

    it('isSelf', () => {
      expect(user1.isSelf).to.equal(true)
      expect(user2.isSelf).to.equal(false)
    })

    it('get user by username', () => {
      expect(Contact.getUserByUserName('test')).to.equal(user1)
    })

    it('get search user', () => {
      expect(Contact.getSearchUser('te')[0]).to.equal(user1)
      expect(Contact.getSearchUser('123').length).to.equal(0)
    })

    it('isRoomContact', () => {
      expect(Contact.isRoomContact(user2)).to.equal(true)
      expect(Contact.isRoomContact(user1)).to.equal(false)
    })
  })
})

describe('wechat', () => {
  var wechatIns = new Wechat()

  it('get uuid', done => {
    wechatIns.getUUID().then(uuid => {
      expect(uuid).to.equal('4dcaWx3uBw==')
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('scan', done => {
    wechatIns.checkScan().then(() => {
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('confirm', done => {
    wechatIns.checkLogin().then(() => {
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('login', done => {
    wechatIns.login().then(() => {
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('init', done => {
    wechatIns.init().then(() => {
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('notifyMobile', done => {
    wechatIns.notifyMobile().then(() => {
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('getContact', done => {
    wechatIns.getContact().then(memberList => {
      expect(Object.keys(memberList).length).to.equal(7)
      expect(memberList['@2035c3436177335bc3f0e756e7cc354a'].AvatarUrl).to.equal('https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgeticon?seq=620964297&username=@2035c3436177335bc3f0e756e7cc354a&skey=@crypt_8e4ad7fa_2703a47aaf8cd4d3e61b855795e38568')
      done()
    }).catch(err => {
      done(err)
    })
  })

  /*it('batchGetContact', done => {
    wechatIns.batchGetContact([{UserName: '@2035c3436177335bc3f0e756e7cc354a'}]).then(groupMemberList => {
      expect(Object.keys(groupMemberList).length).to.equal(1)
      done()
    }).catch(err => {
      done(err)
    })
  })*/

  it('syncCheck normal', done => {
    wechatIns._syncCheck().then(code => {
      expect(code.retcode).to.equal(0)
      expect(code.selector).to.equal(0)
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('syncCheck message', done => {
    wechatIns._syncCheck().then(code => {
      expect(code.retcode).to.equal(0)
      expect(code.selector).to.equal(2)
      done()
    }).catch(err => {
      done(err)
    })
  })

  var msgData = null

  it('_sync', done => {
    wechatIns._sync().then(data => {
      msgData = data
      expect(data['AddMsgList'].length).to.equal(2)
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('handleMsg', () => {
    wechatIns.once('text-message', msg => {
      expect(msg.Content).to.equal('Hello World')
    })

    wechatIns._handleMsg(msgData)
  })
})
