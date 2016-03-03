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

```
	事件
	// this.on('uuid', () => {})
	// this.on('scan', () => {})
	// this.on('confirm', () => {})
	// this.on('login', () => {})
	// this.on('logout', () => {})
	// this.on('error', err => debug(err))

	// this.on('init-message', () => {})
	// this.on('text-message', () => {})
	// this.on('picture-message', () => {})
	// this.on('voice-message', () => {})

	// this.on('mobile-open', () => {})
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
