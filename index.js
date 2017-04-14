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

token = "EAAFZBN7xZAk5sBAG2fcfCrK3zGG7Wraegj8yaxLK1yf8w8KyVji7ygtrgcMJLVrdL2OPGdwyXFVK2ewZCMtJ408gMEZAWBKF2whs1bEwShjoPpJ8jKTkEUV2cv8syZAJ5kqqXagZA1kbpeUPbLd0ZC3gMQZCZBNpeFRb5vIRh6YRSBQZDZD"

// Facebook
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === "uwpcishype") {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token!")
})

app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging_events
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_events[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            sendText(sender, "Text echo: " + text.substring(0, 100))
        }
    }
    res.sendStatus(200)
})

function sendText(sender, text) {
    let messageData = {text: text}
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs : {access_token, token},
        method: "POST",
        json: {
            receipt: {id: sender},
            message: messageData
        }
    }, function(error, respose, body) {
        if (error) {
            console.log("Sending error.")
        } else if (response.body.error) {
            console.log("Response body error.")
        }
    })
}

app.listen(app.get('port'), function() {
    console.log("Running: port")
})