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

####引入 wechat4u

```javascript
const wechat4u = require('wechat4u')
```

####生成实例

```javascript
let wechat = new wechat4u()
```

####启动（分两种方式）

```javascript
// 1. 分布启动
wechat.getUUID().then(uuid => {/*处理uuid*/})
wechat.start() // 返回一个 Promise 对象

// 2. 直接启动
wechat.start(） // 通过事件获得uuid等信息
```

####实例状态判断

```javascript
wechat.state === wechat4u.STATE.init === 'init' // 初始化状态
wechat.state === wechat4u.STATE.uuid === 'uuid' // 已获取 UUID
wechat.state === wechat4u.STATE.login === 'login' // 已登录
wechat.state === wechat4u.STATE.logout === 'logout' // 已退出登录
```

####联系人接口

```javascript
wechat.friendList  // 通讯录（个人联系人，群聊）

wechat.user        // 登陆账号
wechat.memberList  // 所有联系人
wechat.contactList // 个人联系人
wechat.groupList   // 已保存群聊
wechat.groupMemberList // 所有群聊内联系人
wechat.publicList  // 公众账号
wechat.specialList // 特殊账号
```

####消息发送接口

```javascript
wechat.sendMsg(msg, to) // 发送文字消息
wechat.sendImage(to, fileStream, type, size) // 发送图片消息
// 使用 fs 的 createdReadStream 的样例：
// let imgPath = __dirname + '/../public/images/nodeWechat.png'
// let imgStats = fs.statSync(imgPath)
// wechat.sendImage(user['UserName'], fs.createReadStream(imgPath))
```

####Events

```javascript
wechat.on('uuid', uuid => {})
wechat.on('scan', () => {})
wechat.on('confirm', () => {})
wechat.on('login', memberList => {})
wechat.on('logout', msg => {})
wechat.on('error', err => debug(err))

wechat.on('init-message', () => {})
wechat.on('text-message', msg => {})
wechat.on('picture-message', msg => {})
wechat.on('voice-message', msg => {})
wechat.on('emoticon-message', msg => {})
wechat.on('verify-message', msg => {})
```

####消息收取接口

```javascript
wechat.on('text-message', msg => {
  msg['Content'] // '你好！'
})
wechat.on('picture-message', msg => {
  msg['Content'] // {type:'image/jpeg',data:...buf...}
})
wechat.on('voice-message', msg => {
  msg['Content'] // {type:'audio/mp3'',data:...buf...}
})
```

####请求接口

```javascript
wechat.request() // 包含相关 cookie 的 request，目前使用 axios
```

*如无特别强调，接口皆返回一个 promise 对象

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
