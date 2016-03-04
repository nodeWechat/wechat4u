"use strict"
const express = require('express')
const debug = require('debug')('app')

const api = require('./routes/api')

const app = express()

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// 静态文件
app.use('/static', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.render('layout')
})

app.use('/api', api)

const server = app.listen(3000)
