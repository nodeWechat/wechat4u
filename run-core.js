'use strict'
require('babel-register')
const Wechat = require('./src/wechat.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const request = require('request')

let bot = new Wechat()

bot.on('error', err => {
  console.log('错误：', err)
})

bot.on('uuid', uuid => {
  // uuid事件，获取二维码
  qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
    small: true
  })
  console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid)
})

bot.on('user-avatar', avatar => {
  // 手机扫描后可以得到登录用户头像的Data URL
  console.log('登录用户头像Data URL：', avatar)
})

bot.on('login', () => {
  console.log('登录成功')
  let ToUserName = bot.contacts['filehelper'].UserName || 'filehelper'

  // 发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])
  // bot.sendText('发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])', ToUserName)
  //   .catch(err => {
  //     console.log(err)
  //   })
  bot.sendMsg('发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])', ToUserName)
    .catch(err => {
      console.log(err)
    })

  // 发送图片
  // bot.uploadMedia(buffer, filename)
  // bot.uploadMedia(fs.createReadStream('./media/test.jpg'))
  // bot.uploadMedia(request('https://raw.githubusercontent.com/nodeWechat/wechat4u/master/bot-qrcode.jpg'),
  //     'bot-qrcode.jpg')
  //   .then(res => {
  //     return bot.sendPic(res.mediaId, ToUserName)
  //   })
  //   .catch(err => {
  //     console.log(err)
  //   })
  bot.sendMsg({
      file: request('https://raw.githubusercontent.com/nodeWechat/wechat4u/master/bot-qrcode.jpg'),
      filename: 'bot-qrcode.jpg'
    }, ToUserName)
    .catch(err => {
      console.log(err)
    })

  // 通过表情MD5发送表情
  bot.sendEmoticon('00c801cdf69127550d93ca52c3f853ff', ToUserName)
    .catch(err => {
      console.log(err)
    })

  // 通过上传本地gif发送表情
  // bot.uploadMedia(fs.createReadStream('./media/test.gif'))
  //   .then(res => {
  //     return bot.sendEmoticon(res.mediaId, ToUserName)
  //   })
  //   .catch(err => {
  //     console.log(err)
  //   })
  bot.sendMsg({
      file: fs.createReadStream('./media/test.gif')
    }, ToUserName)
    .catch(err => {
      console.log(err)
    })

  // 发送视频
  // bot.uploadMedia(fs.createReadStream('./media/test.mp4'))
  //   .then(res => {
  //     return bot.sendVideo(res.mediaId, ToUserName)
  //   })
  //   .catch(err => {
  //     console.log(err)
  //   })
  bot.sendMsg({
      file: fs.createReadStream('./media/test.mp4')
    }, ToUserName)
    .catch(err => {
      console.log(err)
    })

  // 发送文件
  // bot.uploadMedia(fs.createReadStream('./media/test.txt'))
  //   .then(res => {
  //     return bot.sendDoc(res.mediaId, res.name, res.size, res.ext, ToUserName)
  //   })
  //   .catch(err => {
  //     console.log(err)
  //   })
  bot.sendMsg({
      file: fs.createReadStream('./media/test.txt')
    }, ToUserName)
    .catch(err => {
      console.log(err)
    })
})

bot.on('logout', () => {
  console.log('登出成功')
})

bot.on('contacts-updated', contacts => {
  console.log('联系人数量：', Object.keys(bot.contacts).length)
})

bot.on('message', msg => {
  switch (msg.MsgType) {
    case bot.CONF.MSGTYPE_STATUSNOTIFY:
      // 手机上进行操作后的状态更新信息，内部通过这个消息获取未保存到通讯录的群信息
      console.log('又玩手机辣')
      break
    case bot.CONF.MSGTYPE_TEXT:
      // 文本消息
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(bot.contacts[msg.FromUserName].getDisplayName() + ':\t' + msg.Content)
      bot.getHeadImg(bot.contacts[msg.FromUserName].HeadImgUrl).then(res => {
        fs.writeFileSync(`./media/${msg.FromUserName}.jpg`, res.data)
      }).catch(err => {
        console.log(err)
      })
      break
    case bot.CONF.MSGTYPE_IMAGE:
      // 图片消息
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(bot.contacts[msg.FromUserName].getDisplayName() + ':\t' + '图片信息，手机上查看')
      bot.getMsgImg(msg.MsgId).then(res => {
        fs.writeFileSync(`./media/${msg.MsgId}.jpg`, res.data)
      }).catch(err => {
        console.log(err)
      })
      break
    case bot.CONF.MSGTYPE_VOICE:
      // 语音消息
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(bot.contacts[msg.FromUserName].getDisplayName() + ':\t' + '语音信息，手机上查看')
      bot.getVoice(msg.MsgId).then(res => {
        fs.writeFileSync(`./media/${msg.MsgId}.mp3`, res.data)
      }).catch(err => {
        console.log(err)
      })
      break
    case bot.CONF.MSGTYPE_EMOTICON:
      // 表情消息
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(bot.contacts[msg.FromUserName].getDisplayName() + ':\t' + '表情信息，手机上查看')
      bot.getMsgImg(msg.MsgId).then(res => {
        fs.writeFileSync(`./media/${msg.MsgId}.gif`, res.data)
      }).catch(err => {
        console.log(err)
      })
      break
    case bot.CONF.MSGTYPE_VIDEO:
      // 视频消息
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(bot.contacts[msg.FromUserName].getDisplayName() + ':\t' + '视频信息，手机上查看')
      bot.getVideo(msg.MsgId).then(res => {
        fs.writeFileSync(`./media/${msg.MsgId}.mp4`, res.data)
      }).catch(err => {
        console.log(err)
      })
      break
    case bot.CONF.MSGTYPE_MICROVIDEO:
      // 小视频消息
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(bot.contacts[msg.FromUserName].getDisplayName() + ':\t' + '小视频信息，手机上查看')
      bot.getVideo(msg.MsgId).then(res => {
        fs.writeFileSync(`./media/${msg.MsgId}.mp4`, res.data)
      }).catch(err => {
        console.log(err)
      })
      break
    case bot.CONF.MSGTYPE_VERIFYMSG:
      // 好友请求消息，似乎没什么用，微信上面能取消加好友验证
      // 不过如果是取消了加好友验证，那么就没办法将新好友添加到通讯录，相当于临时会话
      console.log(`----------${msg.getDisplayTime()}----------`)
      bot.verifyUser(msg.RecommendInfo.UserName, msg.RecommendInfo.Ticket)
        .then(res => {
          console.log(`通过 ${bot.Contact.getDisplayName(msg.RecommendInfo)} 好友请求`)
        })
        .catch(err => {
          console.log(err)
        })
      break
    case bot.CONF.MSGTYPE_RECALLED:
      // 撤回消息，Content中有消息的MsgId
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(bot.contacts[msg.FromUserName].getDisplayName() + ' 撤回' + ':\t' + msg.Content)
      break
    case bot.CONF.MSGTYPE_SYS:
      // 系统消息，Content中会提示细节，包括红包消息
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(bot.contacts[msg.FromUserName].getDisplayName() + ':\t' + msg.Content)
      break
    default:
      console.log(`----------${msg.getDisplayTime()}----------`)
      console.log(msg)
      break
  }
})

bot.start()
