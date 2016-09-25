'use strict'
import WechatCore from './src/core.js'

start()

async function start() {
  let bot = new WechatCore()
  let res = undefined
  try {
    res = await bot.getUUID()
    console.log('https://login.weixin.qq.com/qrcode/' + res)
    do {
      res = await bot.checkLogin()
      console.log(res)
    } while (res.code !== 200)
    res = await bot.login()
    console.log(res)
    res = await bot.init()
    console.log(res)
    res = await bot.notifyMobile()
    console.log(res)
    res = await bot.getContact()
    console.log(Object.keys(res).length)
    bot.sendText(new Date().toString(), 'filehelper')
    let intervalID = setInterval(() => {
      bot.sendText(new Date().toString(), 'filehelper')
    }, 5 * 60 * 1000);
    bot.syncPolling(msg => {
      if (!msg) {
        clearInterval(intervalID)
      } else if (msg.AddMsgCount) {
        console.log(msg.AddMsgList[0])
      }
    })
  } catch (err) {
    console.log(err)
    bot.logout()
  }
}
