"use strict"
const express = require('express')
const wechat = require('wechat4u')
const debug = require('debug')('app')

const router = express.Router()

let botInstanceArr = {}

router.get('/uuid', (req, res) => {
  let bot = new wechat()

  bot.getUUID().then((uuid) => {
    res.send(uuid)
    botInstanceArr[uuid] = bot
    debug('New Connect', Object.getOwnPropertyNames(botInstanceArr).length)
  })
})

router.get('/instance/:uuid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]

  if(bot) {
    res.sendStatus(200)
  } else {
    res.sendStatus(404)
  }

})

router.get('/login/:uuid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]

  bot.start()
  .then(() => {
    // 绑定 Logout 事件
  	bot.on('logout', () => {
  		delete botInstanceArr[req.params.uuid]
  		debug('Close Logout Connect', Object.getOwnPropertyNames(botInstanceArr).length)
  	})
    // 返回成功
    res.sendStatus(200)
  })
  .catch((err) => {
    delete botInstanceArr[req.params.uuid]
    debug('Close Not Login Connect', Object.getOwnPropertyNames(botInstanceArr).length)
    // 返回 Forbidden
    res.sendStatus(403)
  })

})

router.get('/members/:uuid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]

  if(bot) {
    res.send(bot.friendList)
  } else {
    res.sendStatus(404)
  }

})

router.get('/members/:uuid/:uid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]
  
  bot.switchUser(req.params.uid).then(() => {
    res.sendStatus(200)
  }).catch(err => {
    res.sendStatus(404)
  })

})

module.exports = router