'use strict'
const path = require('path')
const express = require('express')

const api = require('./routes/api')

const app = express()

app.set('views', path.resolve(__dirname, 'views'))
app.set('view engine', 'jade')

// 静态文件
app.use('/static', express.static(path.resolve(__dirname, 'public')))

app.get('/', (req, res) => {
  res.render('layout')
})

app.use('/api', api)

app.listen(3000)
