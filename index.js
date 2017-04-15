'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express()

app.set('port', (process.env.PORT || 5000))

// Allow static assets
app.use(express.static(__dirname + '/public'));

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
    } else if (text.includes("inventory_category")) {
        sendInventoryCategoryList(sender)
    } else if (text.includes("inventory_canon")) {
        sendInventoryList(sender)
    } else {
        sendText(sender, "Start a conversation by saying hey!")
    }
}

function sendText(sender, text) {
    let messageData = {text: text}
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

function sendInventoryList(sender) {
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
                        template_type: "list",
                        top_element_style: "compact",
                        elements: [
                            {
                                title: "[CAN01] Canon 5D kit",
                                image_url: app_url + "/images/canon_5d.jpg",
                                subtitle: "Full-Frame, 13.2 Mpix, 3fps.",
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "Rent at $35",
                                        payload: "UNDEFINED"  
                                    }
                                ]
                            },
                            {
                                title: "[CAN02] Canon T1i kit",
                                image_url: app_url + "/images/canon_t1i.jpg",
                                subtitle: "APS-C, 15.0 Mpix, 3fps.",
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "Rent at $35",
                                        payload: "UNDEFINED"  
                                    }
                                ]
                            },
                            {
                                title: "[CAN03] Canon T3i kit",
                                image_url: app_url + "/images/canon_t3i.jpg",
                                subtitle: "APS-C, 18.7 Mpix, 3fps.",
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "Rent at $35",
                                        payload: "UNDEFINED"  
                                    }
                                ]
                            }
                        ],
                        buttons: [
                            {
                                type: "postback",
                                title: "View More",
                                payload: "UNDEFINED"                        
                            }
                        ]
                    }
                }
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Sending error.")
            console.log(response.body)
        } else if (response.body.error) {
            console.log("Response body error.")
            console.log(response.body)
        }
    })
}

function sendInventoryCategoryList(sender) {
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
                                title: "Canon Kits",
                                image_url: app_url + "images/canon_kits_bg.jpg",
                                subtitle: "See impossible.",
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "List of Canon Kits",
                                        payload: "inventory_canon"
                                    }
                                ]
                            },
                            {
                                title: "Nikon Kits",
                                image_url: app_url + "images/nikon_kits_bg.jpg",
                                subtitle: "At the heart of the image.",
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "List of Nikon Kits",
                                        payload: "inventory_nikon"
                                    }
                                ]
                            },
                            {
                                title: "Flashlights",
                                image_url: app_url + "images/flashlights_bg.jpg",
                                subtitle: "Photography is the art of light.",
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "List of Flashlights",
                                        payload: "inventory_flash"
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Sending error.")
            console.log(response.body)
        } else if (response.body.error) {
            console.log("Response body error.")
            console.log(response.body)
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
                                subtitle: "We\'ve got the right camera for you.",
                                default_action: {
                                    type: "web_url",
                                    url: "https://uwphoto.ca/",
                                    messenger_extensions: false,
                                    webview_height_ratio: "tall",
                                },
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "Our Inventory",
                                        payload: "inventory_category"
                                    },{
                                        type: "postback",
                                        title: "Rental Requests",
                                        payload: "DEVELOPER_DEFINED_PAYLOAD"
                                    },{
                                        type: "postback",
                                        title: "Exec Log In",
                                        payload: "DEVELOPER_DEFINED_PAYLOAD"
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Sending error.")
            console.log(response.body)
        } else if (response.body.error) {
            console.log("Response body error.")
            console.log(response.body)
        }
    })
}

app.listen(app.get('port'), function() {
    console.log("Running: port")
})