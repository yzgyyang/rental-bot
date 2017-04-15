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

const token = process.env.FB_VERIFY_TOKEN
const access = process.env.FB_ACCESS_TOKEN

const app_url = 'https://uwpcrentalbot.herokuapp.com/'

// Facebook
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === access) {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token!")
})

app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_events[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            decideMessage(sender, text)
        }
        if (event.postback) {
            let text = JSON.stringify(event.postback)
            decideMessage(sender, text)
            continue
        }
    }
    res.sendStatus(200)
})

function decideMessage(sender, text1) {
    let text = text1.toLowerCase()
    if (text.includes("hey")) {
        sendGenericMessage(sender)
    } else {
        sendText(sender, "Start conversation by saying hey!")
    }
}

function sendText(sender, text) {
    let messageData = {text: text}
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs : {access_token: token},
        method: "POST",
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Sending error.")
        } else if (response.body.error) {
            console.log("Response body error.")
        }
    })
}

function sendButtonMessage(sender, text, buttons) {
    let messageData = {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: text,
                buttons: buttons
            }
        }
    }
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: token},
        method: "POST",
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Sending error.")
        } else if (response.body.error) {
            console.log("Response body error.")
        }
    })
}

function sendGenericMessage(sender) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: token},
        method: "POST",
        json: {
            recipient: {id: sender},
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [
                            {
                                title: "Welcome to UWPC Rentals!",
                                image_url: app_url + "images/uwpc_rentals_bg.jpg",
                                subtitle: "We\'ve got the right camera for everyone.",
                                default_action: {
                                    "type": "web_url",
                                    "url": "http://uwphoto.ca/",
                                    "messenger_extensions": true,
                                    "webview_height_ratio": "tall",
                                    "fallback_url": "http://uwphoto.ca/"
                                },
                                buttons: [
                                    {
                                        "type":"postback",
                                        "title":"See existing rentals",
                                        "payload":"DEVELOPER_DEFINED_PAYLOAD"
                                    },{
                                        "type":"postback",
                                        "title":"Start a rental request",
                                        "payload":"DEVELOPER_DEFINED_PAYLOAD"
                                    },{
                                        "type":"postback",
                                        "title":"Exec log in",
                                        "payload":"DEVELOPER_DEFINED_PAYLOAD"
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    })
}

app.listen(app.get('port'), function() {
    console.log("Running: port")
})