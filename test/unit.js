require('./nock')
var expect = require('chai').expect

var Wechat = require('../src/wechat')

describe('wechat', () => {
  var wechatIns = new Wechat
  
  it('get uuid', () => {
    wechatIns.getUUID().then(uuid => {
      expect(uuid).to.equal('4dcaWx3uBw==')
    })
  })
  
  it('scan', done => {
    wechatIns.checkScan().then( () => {
      done()
    })
  })
  
  it('confirm', done => {
    wechatIns.checkLogin().then( () => {
      done()
    })
  })
  
  it('login', done => {
    wechatIns.login().then( () => {
      done()
    })
  })

  it('init', done => {
    wechatIns.init().then( () => {
      done()
    })
  })
  
  it('notifyMobile', done => {
    wechatIns.notifyMobile().then( () => {
      done()
    })
  })
  
  it('getContact', done => {
    wechatIns.getContact().then( memberList => {
      expect(memberList.length).to.equal(7)
      done()
    })
  })
  
  it('batchGetContact', done => {
    wechatIns.batchGetContact().then( groupMemberList => {
      expect(groupMemberList.length).to.equal(1)
      done()
    })
  })
  
  it('syncCheck normal', done => {
    wechatIns._syncCheck().then( code => {
      expect(code.retcode).to.equal(0)
      expect(code.selector).to.equal(0)
      done()
    })
  })
  
  it('syncCheck message', done => {
    wechatIns._syncCheck().then( code => {
      expect(code.retcode).to.equal(0)
      expect(code.selector).to.equal(2)
      done()
    })
  })
  
  var msgData = null
  
  it('_sync', () => {
    wechatIns._sync().then( data => {
      msgData = data
      expect(data['AddMsgList'].length).to.equal(2)
      done()
    })
  })
  
  it('handleMsg', () => {
    wechatIns.once('text-message', msg => {
      expect(msg.Content).to.equal('Hello World')
    })
    
    wechatIns._handleMsg(msgData)
  })
  
})
