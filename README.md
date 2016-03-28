#wechat4u.js
![](http://7xr8pm.com1.z0.glb.clouddn.com/nodeWechat.png)

##安装使用
```
npm install wechat4u
```

##使用Example测试
```
npm run example
```

## API 说明

```javascript
  const wechat4u = require('wechat4u')
  
  let wechat = new wechat4u()
  
  wechat.getUUID().then(uuid => {/*处理uuid*/})
  wechat.start() // 完成登陆过程，需手机端通过网页版登陆验证
  
  wechat.sendMsg(msg, to) // 发送文字消息
  wechat.sendImage(to, fileStream, type, size) // 发送图片消息
  // 使用 fs 的 createdReadStream 的样例：
  // let imgPath = __dirname + '/../public/images/nodeWechat.png'
  // let imgStats = fs.statSync(imgPath)
  // wechat.sendImage(user['UserName'], fs.createReadStream(imgPath), imgStats.type, imgStats.size)
  
  wechat.friendList // 好友列表
  wechat.user // 登陆用户
  wechat.memberList // 所有好友
  wechat.contactList // 个人好友
  wechat.groupList // 群
  wechat.publicList // 公众账号
  wechat.specialList // 特殊账号
  
  wechat.on('uuid', () => {})
  wechat.on('scan', () => {})
  wechat.on('confirm', () => {})
  wechat.on('login', () => {})
  wechat.on('logout', () => {})
  wechat.on('error', err => debug(err))
  wechat.on('init-message', () => {})
  wechat.on('text-message', () => {})
  wechat.on('picture-message', () => {})
  wechat.on('voice-message', () => {})
  wechat.on('mobile-open', () => {})
  
  wechat.state === wechat4u.STATE.init === 'init'
  wechat.state === wechat4u.STATE.uuid === 'uuid'
  wechat.state === wechat4u.STATE.login === 'login'
  wechat.state === wechat4u.STATE.logout === 'logout'
  
  wechat.request() // 自带的 request，包含cookie
```


##相关项目

关于微信网页端机器人的实现，已经有大量的轮子了。感谢各位大神！（排名不分先后。。收录的肯定也不齐。。）

* [Python2 的 WeixinBot](https://github.com/Urinx/WeixinBot)
* [QT 的 QWX](https://github.com/xiangzhai/qwx)
* [Node，可能会写成uProxy插件的 uProxy_wechat](https://github.com/LeMasque/uProxy_wechat)
* [Node，可在shell中直接运行的 wechat-user-bot](https://github.com/HalfdogStudio/wechat-user-bot)
* [Python3 的 wechat_robot](https://github.com/lyyyuna/wechat_robot)
* [开放协议 支持 QQ&微信 的 wxagent](https://github.com/kitech/wxagent)
* [在微信网页版和 IRC 间搭建通道支持 IRC 操作的 wechatircd](https://github.com/MaskRay/wechatircd)
* [Chrome 插件版的微信机器人](https://github.com/spacelan/weixin-bot-chrome-extension)

关于微信网页端的接口说明，也有好几篇分析的很厉害的文章。

* [Reverland 大神的web 微信与基于node的微信机器人实现](http://reverland.org/javascript/2016/01/15/webchat-user-bot/)
* [Urinx 大神的 API Map](https://github.com/Urinx/WeixinBot/blob/master/README.md)
* [聂永 大神的 微信协议简单调研笔记](http://www.blogjava.net/yongboy/archive/2014/03/05/410636.html)

好了，差不多就这些资料了。如果想要开发个自己的，那就开工吧！
