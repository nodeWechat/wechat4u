import fs from 'fs'
import path from 'path'
import nock from 'nock'

const check = (key, value) => data => data[key] === value
const checkUin = check('Uin', 155217200)
const checkuin = check('uin', '155217200')
const checkSid = check('Sid', 'PsWd4FvKROR5EVcG')
const checksid = check('sid', 'PsWd4FvKROR5EVcG')
const checkSkey = check('Skey', '@crypt_8e4ad7fa_2703a47aaf8cd4d3e61b855795e38568')
const checkskey = check('skey', '@crypt_8e4ad7fa_2703a47aaf8cd4d3e61b855795e38568')
const checkPassTicket = check('pass_ticket', 'VgRra8tyYbvfTTS3LVlIHdFob0XowE6%2BZV9X1PB9w9w%3D')

var checkBaseRequest = data => {
  return data &&
    data.BaseRequest &&
    checkUin(data.BaseRequest) &&
    checkSid(data.BaseRequest) &&
    checkSkey(data.BaseRequest) &&
    data.BaseRequest.DeviceID
}

nock('https://login.weixin.qq.com')
  .post('/jslogin')
  .query({
    'appid': 'wx782c26e4c19acffb',
    'fun': 'new',
    'lang': 'zh_CN'
  })
  .reply(200, 'window.QRLogin.code = 200; window.QRLogin.uuid = "4dcaWx3uBw==";')

nock('https://login.weixin.qq.com')
  .get('/cgi-bin/mmwebwx-bin/login')
  .query({
    'tip': '1',
    'uuid': '4dcaWx3uBw=='
  })
  .reply(200, 'window.code=201;')

nock('https://login.weixin.qq.com')
  .get('/cgi-bin/mmwebwx-bin/login')
  .query({
    'tip': '0',
    'uuid': '4dcaWx3uBw=='
  })
  .reply(200, 'window.code=200;window.redirect_uri="https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?ticket=A6NZxcl2chBSJUFYj9hPlKMV@qrticket_0&uuid=4dcaWx3uBw==&lang=zh_CN&scan=1463755895";')

// login (redirect_uri)
nock('https://wx2.qq.com')
  .get('/cgi-bin/mmwebwx-bin/webwxnewloginpage?ticket=A6NZxcl2chBSJUFYj9hPlKMV@qrticket_0&uuid=4dcaWx3uBw==&lang=zh_CN&scan=1463755895&fun=new')
  .reply(200, '<error><ret>0</ret><message>OK</message><skey>@crypt_8e4ad7fa_2703a47aaf8cd4d3e61b855795e38568</skey><wxsid>PsWd4FvKROR5EVcG</wxsid><wxuin>155217200</wxuin><pass_ticket>VgRra8tyYbvfTTS3LVlIHdFob0XowE6%2BZV9X1PB9w9w%3D</pass_ticket><isgrayscale>1</isgrayscale></error>')

// init
nock('https://wx2.qq.com')
  .post('/cgi-bin/mmwebwx-bin/webwxinit', data => {
    return checkBaseRequest(data)
  })
  .query(data => {
    return data &&
      checkPassTicket(data) &&
      checkskey(data)
  })
  .reply(200, fs.readFileSync(path.resolve(__dirname, './response/webwxinit'), 'utf-8'))

// notifyMobile
nock('https://wx2.qq.com')
  .post('/cgi-bin/mmwebwx-bin/webwxstatusnotify', data => {
    return data &&
      checkBaseRequest(data)
  })
  .reply(200, '{"BaseResponse": {"Ret": 0,"ErrMsg": ""},"MsgID": "3199705316661781423"}')

// getContact
nock('https://wx2.qq.com')
  .post('/cgi-bin/mmwebwx-bin/webwxgetcontact')
  .query(data => {
    return data &&
      checkPassTicket(data) &&
      checkskey(data)
  })
  .reply(200, fs.readFileSync(path.resolve(__dirname, './response/webwxgetcontact'), 'utf-8'))

// batchGetContact
nock('https://wx2.qq.com')
  .post('/cgi-bin/mmwebwx-bin/webwxbatchgetcontact', data => {
    return data &&
      checkBaseRequest(data)
  })
  .query(data => {
    return data &&
      checkPassTicket(data)
  })
  .reply(200, fs.readFileSync(path.resolve(__dirname, './response/webwxbatchgetcontact'), 'utf-8'))

var webpushTimes = 0

nock('https://webpush2.weixin.qq.com')
  .get('/cgi-bin/mmwebwx-bin/synccheck')
  .query(data => {
    return data &&
      checksid(data) &&
      checkskey(data) &&
      checkuin(data)
  })
  .times(10)
  .reply(200, uri => {
    webpushTimes++
    if (webpushTimes === 2 || webpushTimes === 4) {
      return 'window.synccheck={retcode:"0",selector:"2"}'
    } else if (webpushTimes > 5) {
      return 'window.synccheck={retcode:"2",selector:"2"}'
    }
    return 'window.synccheck={retcode:"0",selector:"0"}'
  })

nock('https://wx2.qq.com')
  .post('/cgi-bin/mmwebwx-bin/webwxsync', data => {
    return data &&
      checkBaseRequest(data)
  })
  .query(data => {
    return data &&
      checksid(data) &&
      checkskey(data) &&
      checkPassTicket(data)
  })
  .times(2)
  .reply(200, fs.readFileSync(path.resolve(__dirname, './response/webwxsync'), 'utf-8'))

nock('https://wx2.qq.com')
  .post('/cgi-bin/mmwebwx-bin/webwxlogout')
  .query(data => {
    return data &&
      checkskey(data)
  })
  .reply(200, '')

export default nock
