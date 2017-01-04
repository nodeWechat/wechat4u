# wechat4u.js

![](http://7xr8pm.com1.z0.glb.clouddn.com/nodeWechat.png)
[![npm version](https://img.shields.io/npm/v/wechat4u.svg)](https://www.npmjs.org/package/wechat4u)
[![wechat group](https://img.shields.io/badge/wechat-group-brightgreen.svg)](http://www.qr-code-generator.com/phpqrcode/getCode.php?cht=qr&chl=http%3A%2F%2Fweixin.qq.com%2Fg%2FA1zJ47b19KtgMnAx&chs=180x180&choe=UTF-8&chld=L|0)

## Have A Try ?

* 测试服务器

[wechat4u.duapp.com](http://wechat4u.duapp.com)，具有自动回复（文本，表情），监控和群发等功能

* 测试微信机器人

![微信号：abotofwechat4u](https://raw.githubusercontent.com/nodeWechat/wechat4u/master/bot-qrcode.jpg)

扫描二维码，开启激情果撩，验证消息：**我爱wechat4u**

## 安装使用

wechat4u@0.6.x更新了大量API，增强了稳定性

```
npm install --save wechat4u@latest
```

```javascript
const Wechat = require('wechat4u')
let bot = new Wechat()
bot.start()
// 或使用核心API
// const WechatCore = require('wechat4u/lib/core')
```

## 开发测试

```
git clone https://github.com/nodeWechat/wechat4u.git
cd wechat4u
npm install
npm run example // web服务器模式
npm run core // 命令行模式
npm run compile // babel编译
```

## 使用范例

`node run-core.js`

逻辑见代码，简明完整

## 实例属性

所有属性均只读

##### bot.PROP

保持登录状态的必要信息

##### bot.CONF

配置信息，包括当前服务器地址，API路径和一些常量

程序中需要使用CONF中的常量来判断当前状态的新消息类型

```javascript
bot.state == bot.CONF.STATE.init // 初始化状态
bot.state == bot.CONF.STATE.uuid // 已获取 UUID
bot.state == bot.CONF.STATE.login // 已登录
bot.state == bot.CONF.STATE.logout // 已退出登录
msg.MsgType == bot.CONF.MSGTYPE_TEXT // 文本消息
msg.MsgType == bot.CONF.MSGTYPE_IMAGE // 图片消息
msg.MsgType == bot.CONF.MSGTYPE_VOICE // 语音消息
msg.MsgType == bot.CONF.MSGTYPE_EMOTICON // 自定义表情消息
msg.MsgType == bot.CONF.MSGTYPE_MICROVIDEO // 小视频消息
msg.MsgType == bot.CONF.MSGTYPE_VIDEO // 视频消息
```

##### bot.state

当前状态

##### bot.user

当前登录用户信息

##### bot.contacts

所有联系人，包括通讯录联系人，近期联系群，公众号

key为联系人UserName，UserName是本次登录时每个联系人的UUID，不过下次登录会改变

value为`Contact`对象，具体属性方法见`src/interface/contact.js`

##### msg

登录后接受到的所有消息

msg为`Message`对象，具体属性方法见`src/interface/message.js`

## 实例API

##### bot.start()

启动实例，登录和保持同步

调用该方法后，通过监听事件来处理消息

##### bot.stop()

停止实例，退出登录

调用该方法后，通过监听`logout`事件来登出

#### 以下方法均返回Promise

##### bot.sendText(msgString, toUserName)

发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])

##### bot.uploadMedia(Buffer | Stream | File, filename, toUserName)

上传媒体文件

返回
```javascript
{
  name: name,
  size: size,
  ext: ext,
  mediatype: mediatype,
  mediaId: mediaId
}
```

##### bot.sendPic(mediaId, toUserName)

发送图片，mediaId为uploadMedia返回的mediaId

```javascript
bot.uploadMedia(fs.createReadStream('test.png'))
  .then(res => {
    return bot.sendPic(res.mediaId, ToUserName)
  })
  .catch(err => {
    console.log(err)
  })
```

##### bot.sendEmoticon(md5 | mediaId, toUserName)

发送表情，可是是表情的MD5或者uploadMedia返回的mediaId

表情的MD5，可以自己计算但是可能不存在在微信服务器中，也可以从微信返回的表情消息中获得

##### bot.sendVideo(mediaId, toUserName)

发送视频

##### bot.sendDoc(mediaId, name, size, ext, toUserName)

以应用卡片的形式发送文件，可以通过这个API发送语音

##### bot.sendMsg(msg, toUserName)

对以上发送消息的方法的封装，是发送消息的通用方法

当msg为string时，发送文本消息

当msg为`{file:xxx,filename:'xxx.ext'}`时，发送对应媒体文件

```javascript
bot.sendMsg({
    file: request('https://raw.githubusercontent.com/nodeWechat/wechat4u/master/bot-qrcode.jpg'),
    filename: 'bot-qrcode.jpg'
  }, ToUserName)
  .catch(err => {
    console.log(err)
  })
```

##### bot.getHeadImg(HeadImgUrl)

获取联系人头像

```javascript
bot.getHeadImg(bot.contacts[UserName].HeadImgUrl).then(res => {
  fs.writeFileSync(`${UserName}.jpg`, res.data)
}).catch(err => {
  console.log(err)
})
```

##### bot.getMsgImg(MsgId)

获取图片或表情

```javascript
bot.getMsgImg(msg.MsgId).then(res => {
  fs.writeFileSync(`${msg.MsgId}.jpg`, res.data)
}).catch(err => {
  console.log(err)
})
```

##### bot.getVoice(MsgId)

获取语音

##### bot.getVideo(MsgId)

获取小视频或视频

##### bot.verifyUser(UserName, Ticket)

通过好友添加请求

##### bot.updateChatroom(ChatRoomName, MemberList, fun)

更新群成员

ChatRoomName '@@'开头的群UserName

MemberList 数组，联系人UserNa

fun 可选'addmember'，'delmember'，'invitemember'

##### bot.opLog(UserName, OP)

置顶或取消置顶联系人，可通过直接取消置顶群来获取群ChatRoomOwner

OP == 0 取消置顶

OP == 1 置顶

##### bot.updateRemarkName(UserName, RemarkName)

设置联系人备注或标签

## 实例事件

##### uuid

得到uuid，之后可以构造二维码或从微信服务器取得二维码

```javascript
bot.on('uuid', uuid => {
  qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
    small: true
  })
  console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid)
})
```

##### user-avatar

手机扫描后可以得到登录用户头像的Data URL

##### login

手机确认登录

##### logout

成功登出

##### contacts-updated

联系人更新，可得到已更新的联系人列表

##### message

所有通过同步得到的消息，通过`msg.MsgType`判断消息类型

```javascript
bot.on('message', msg => {
  switch (msg.MsgType) {
    case bot.CONF.MSGTYPE_STATUSNOTIFY:
      break
    case bot.CONF.MSGTYPE_TEXT:
      break
    case bot.CONF.MSGTYPE_RECALLED:
      break
  }
})
```

##### error

## Contact对象和Message对象

每个contact，继承自 interface/contact，除原本 json 外，扩展以下属性：

```javascript
contact.AvatarUrl // 处理过的头像地址
contact.isSelf    // 是否是登录用户本人

contact.getDisplayName()
contact.canSearch(keyword)
```

此外，wechat4u 在实例上提供 Contact 作为联系人的通用接口，扩展以下属性：

```javascript
wechat.contact.isRoomContact()
wechat.contact.isSpContact()
wechat.contact.isPublicContact()

wechat.Contact.getUserByUserName()
wechat.Contact.getSearchUser(keyword)
```

每个msg 对象继承自 interface/message，出原本 json 外，具有以下属性：

```javascript
message.isSendBySelf // 是否是本人发送

message.isSendBy(contact)
message.getPeerUserName() // 获取所属对话的联系人 UserName
message.getDisplayTime() // 获取形如 12:00 的时间戳信息
```


## 相关项目

关于微信网页端机器人的实现，已经有大量的轮子了。感谢各位大神！（排名不分先后。。收录的肯定也不齐。。）

* [Python2 的 WeixinBot](https://github.com/Urinx/WeixinBot)
* [QT 的 QWX](https://github.com/xiangzhai/qwx)
* [Node，可能会写成uProxy插件的 uProxy_wechat](https://github.com/LeMasque/uProxy_wechat)
* [Node，可在shell中直接运行的 wechat-user-bot](https://github.com/HalfdogStudio/wechat-user-bot)
* [Python3 的 wechat_robot](https://github.com/lyyyuna/wechat_robot)
* [开放协议 支持 QQ&微信 的 wxagent](https://github.com/kitech/wxagent)
* [在微信网页版和 IRC 间搭建通道支持 IRC 操作的 wechatircd](https://github.com/MaskRay/wechatircd)
* [Chrome 插件版的微信机器人](https://github.com/spacelan/weixin-bot-chrome-extension)

关于微信网页端的接口说明，也有好几篇分析的很厉害的文章。

* [Reverland 大神的web 微信与基于node的微信机器人实现](http://reverland.org/javascript/2016/01/15/webchat-user-bot/)
* [Urinx 大神的 API Map](https://github.com/Urinx/WeixinBot/blob/master/README.md)
* [聂永 大神的 微信协议简单调研笔记](http://www.blogjava.net/yongboy/archive/2014/03/05/410636.html)

好了，差不多就这些资料了。如果想要开发个自己的，那就开工吧！
