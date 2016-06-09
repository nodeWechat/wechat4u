/* eslint-env node, mocha */
import {expect} from 'chai'

import './nock'

import Wechat from '../src/wechat'
import * as util from '../src/util'
import initMessage, * as messageMethod from '../src/interface/message'
import initContact, * as contactMethod from '../src/interface/contact'

describe('util', () => {
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
})

describe('message interface', () => {
  it('content prase', () => {
    expect(messageMethod.contentPrase('&lt;a&gt;<br/>bc')).to.equal('<a>\nbc')
  })

  it('message init', () => {
    var a = {
      FromUserName: 'test',
      Content: '&lt;a&gt;<br/>bc'
    }
    initMessage(a)

    expect(a.FromUserName).to.equal('test')
    expect(a.Content).to.equal('<a>\nbc')
  })
})

describe('contact interface', () => {
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

  it('contact init', () => {
    var a = {
      UserName: 'test',
      NickName: 'test',
      HeadImgUrl: '/test'
    }
    initContact(a, {baseUri: 'https://wx2.qq.com/'})

    expect(a.NickName).to.equal('test')
    expect(a.getDisplayName()).to.equal('test')
    expect(a.HeadImgUrl).to.equal('https://wx2.qq.com/test')
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
      expect(memberList.length).to.equal(7)
      expect(memberList[1].HeadImgUrl).to.equal('https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgeticon?seq=620964297&username=@2035c3436177335bc3f0e756e7cc354a&skey=@crypt_8e4ad7fa_2703a47aaf8cd4d3e61b855795e38568')
      done()
    }).catch(err => {
      done(err)
    })
  })

  it('batchGetContact', done => {
    wechatIns.batchGetContact().then(groupMemberList => {
      expect(groupMemberList.length).to.equal(1)
      done()
    }).catch(err => {
      done(err)
    })
  })

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
