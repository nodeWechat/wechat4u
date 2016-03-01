#微信机器人
![](http://7xr8pm.com1.z0.glb.clouddn.com/nodeWechat.png)

开发前参考了 [WeiXinBot](https://github.com/Urinx/WeixinBot) 和 微信网页版源码。


##测试开发

仅尝试功能的话，可在demo服务器中测试，支持多用户实例。

 * [原始版本(with jQuery)](http://www.sitixi.com:3000) 
 * [vue版本(新功能)](http://www.sitixi.com:3001) 

如果需要调试开发，首先安装好 node.js 开发环境，运行

```shell
npm install # 建议使用cnpm
DEBUG=wechat,app node ./app.js
```

即可运行实例在 `http://localhost:3000/` 。

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
