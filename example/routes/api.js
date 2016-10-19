'use strict'
const express = require('express')
const WxBot = require('../lib/wxbot')
const debug = require('debug')('app')

const router = express.Router()

let botInstanceArr = {}

router.get('/uuid', (req, res) => {
  let bot = new WxBot()
  bot.on('uuid', uuid => {
    res.send(uuid)
    botInstanceArr[uuid] = bot
    debug('新连接', Object.getOwnPropertyNames(botInstanceArr).length)
  })
  bot.on('logout', () => {
    res.sendStatus(404)
    debug('获取UUID失败')
  })

  bot.start()
})

router.get('/instance/:uuid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]

  debug(req.params.uuid, !!bot)
  if (bot && bot.state === WxBot.STATE.login) {
    res.sendStatus(200)
  } else {
    res.sendStatus(404)
  }
})

router.get('/login/:uuid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]
  if (!bot) {
    return res.sendStatus(404)
  }
  bot.removeAllListeners('logout')
  bot.on('logout', () => {
    delete botInstanceArr[req.params.uuid]
    debug('Close Logout Connect', Object.getOwnPropertyNames(botInstanceArr).length)
  })
  if (bot.state == WxBot.STATE.uuid) {
    bot.on('login', () => {
      res.sendStatus(200)
    })
  } else if (bot.state == WxBot.STATE.login) {
    res.sendStatus(200)
  } else {
    delete botInstanceArr[req.params.uuid]
    debug('Close Not Login Connect', Object.getOwnPropertyNames(botInstanceArr).length, err)
    res.sendStatus(403)
  }
})

router.get('/members/:uuid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]

  if (bot && bot.state === WxBot.STATE.login) {
    res.send(bot.replyUsersList)
  } else {
    res.sendStatus(404)
  }
})

router.get('/members/:uuid/:uid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]
  if (!bot) {
    return res.sendStatus(404)
  }
  if (bot.replyUsers.has(req.params.uid)) {
    bot.replyUsers.delete(req.params.uid)
    debug('删除自动回复用户', req.params.uid)
  } else {
    bot.replyUsers.add(req.params.uid)
    debug('增加自动回复用户', req.params.uid)
  }
  res.sendStatus(200)
})

router.get('/supervise/:uuid/:uid', (req, res) => {
  let bot = botInstanceArr[req.params.uuid]
  if (!bot) {
    return res.sendStatus(404)
  }
  if (bot.superviseUsers.has(req.params.uid)) {
    bot.superviseUsers.delete(req.params.uid)
    debug('删除监督用户', req.params.uid)
  } else {
    bot.superviseUsers.add(req.params.uid)
    debug('增加监督用户', req.params.uid)
  }
  res.sendStatus(200)
})

module.exports = router
