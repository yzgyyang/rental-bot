'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express()

app.set('port', (process.env.PORT || 5000))

// Allow to process the data
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// Routes
app.get('/', function(req, res) {
    res.send("Hi, I am a UWPC Rental Bot!")
})

// Facebook
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === "uwpcishype") {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token!")
})

app.listen(app.get('port'), function() {
    console.log("Running: port")
})