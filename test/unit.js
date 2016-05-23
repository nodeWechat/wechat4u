require('./nock')
var expect = require('chai').expect

var Wechat = require('../src/wechat')

describe('wechat', () => {
  var wechatIns = new Wechat

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
