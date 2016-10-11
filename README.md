# wechat4u.js

![](http://7xr8pm.com1.z0.glb.clouddn.com/nodeWechat.png)

wechat4u core分支更新了大量API，增强了稳定性

## 运行

```
npm install
DEBUG=core,wechat node run-core.js
```

以上`DEBUG`环境变量指定是否输出调试信息，可去掉

## 使用示例

所有API和使用方法均在run-core.js中呈现

```js
'use strict'
require('babel-register')
const Wechat = require('./src/wechat.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')

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
  let ToUserName = bot.contacts['filehelper'].UserName

  // 发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])
  bot.sendText('发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])', ToUserName)
    .catch(err => {
      console.log(err)
    })

  // 发送图片
  bot.uploadMedia(fs.createReadStream('./media/test.png'))
    .then(res => {
      return bot.sendPic(res.mediaId, ToUserName)
    })
    .catch(err => {
      console.log(err)
    })

  // 通过表情MD5发送表情
  bot.sendEmoticon('00c801cdf69127550d93ca52c3f853ff', ToUserName)
    .catch(err => {
      console.log(err)
    })

  // 通过上传本地gif发送表情
  bot.uploadMedia(fs.createReadStream('./media/test.gif'))
    .then(res => {
      return bot.sendEmoticon(res.mediaId, ToUserName)
    })
    .catch(err => {
      console.log(err)
    })

  // 发送视频
  bot.uploadMedia(fs.createReadStream('./media/test.mp4'))
    .then(res => {
      return bot.sendVideo(res.mediaId, ToUserName)
    })
    .catch(err => {
      console.log(err)
    })

  // 发送文件
  bot.uploadMedia(fs.createReadStream('./media/test.txt'))
    .then(res => {
      return bot.sendDoc(res.mediaId, res.name, res.size, res.ext, ToUserName)
    })
    .catch(err => {
      console.log(err)
    })
})

bot.on('logout', () => {
  console.log('登出成功')
})

bot.on('contacts-updated', contacts => {
  console.log('联系人数量：', Object.keys(this.contacts).length)
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

      break
    case bot.CONF.MSGTYPE_RECALLED:

      break
    default:

      break
  }
})

bot.start()
```
