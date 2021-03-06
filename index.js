'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')

var pg = require('pg')
pg.defaults.ssl = true;

var app = express()

app.set('port', (process.env.PORT || 5000))

// Allow static assets
app.use(express.static(__dirname + '/public'))

// Allow to process the data
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// PostgreSQL Template
/*
pg.connect(process.env.DATABASE_URL, function(err, client) {
    if (err) throw err
    console.log('Connected to postgres! Getting schemas...')
    client
        .query('SELECT table_schema,table_name FROM information_schema.tables;')
        .on('row', function(row) {
          console.log(JSON.stringify(row))
    })
})
*/

// Routes
app.get('/', function(req, res) {
    res.send("Hi, I am a UWPC Rental Bot!")
})

const token = process.env.FB_VERIFY_TOKEN
const access = process.env.FB_ACCESS_TOKEN

const app_url = 'https://uwpcrentalbot.herokuapp.com/'

// Facebook Webhooks
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
        } else if (event.postback) {
            let text = JSON.stringify(event.postback)
            decidePayload(sender, text)
        }
    }
    res.sendStatus(200)
})

// Functions
function decideMessage(sender, text1) {
    let text = text1.toLowerCase()
    if (text.includes("hey")) {
        sendPayloadMessage(sender, payloadGreetingMessage)
    } else if (text.includes("test_user_login")) {
        var user = identUser(sender)
        sendText(sender, JSON.stringify(user))
    } else {
        sendText(sender, "Start a conversation by saying hey!")
    }
}

function decidePayload(sender, text1) {
    let text = text1.toLowerCase()
    if (text.includes("auth_exec")) {
        authExec(sender)
    } else if (text.includes("inventory_category")) {
        sendPayloadMessage(sender, payloadInventoryCategory)
    } else if (text.includes("inventory_cameras")) {
        sendPayloadMessage(sender, payloadCameraList)
    } else if (text.includes("rental_requests")) {
        sendPayloadMessage(sender, payloadRequestsCategory)
    } else if (text.includes("user_defined_payload")) {
    	sendText(sender, "This function is currently disabled by the administrator. " +
    		"Please use the Google Form at http://uwphoto.ca/rentals.")
    } else if (text.includes("hey")) {
    	sendPayloadMessage(sender, payloadGreetingMessage)
    } else {
    	sendText(sender, "Undefined Payload:" + text + ". Internal error.")
    }
}

function identUser(sender) {
    var user = {}
    var url = "https://graph.facebook.com/v2.6/" + sender
    url += "?fields=first_name,last_name,profile_pic,gender"
    url += "&access_token=" + process.env.FB_ACCESS_TOKEN
    request(url, function(error, response, body) {
        if (error) {
            console.log("Sending error.")
        } else if (response.body.error) {
            console.log("identUser(): Response body error.")
        } else {
            console.log(body)
            user = JSON.parse(body)
        }
    })
    pg.connect(process.env.DATABASE_URL, function(err, client) {
        if (err) throw err
        client
            .query('SELECT psid FROM public.users WHERE psid LIKE $1;', [sender], function(err, res) {
                if (res.row === null) {
                    client
                        .query('INSERT INTO public.users (psid, first_name, last_name, profile_pic, gender) VALUES ($1, $2, $3, $4, $5);',
                                [sender, user.first_name, user.last_name, user.profile_pic, user.gender])
                } else {
                    client
                        .query('UPDATE public.users SET first_name = $1, last_name = $2, profile_pic = $3, gender = $4 WHERE psid LIKE $5',
                                [user.first_name, user.last_name, user.profile_pic, user.gender, sender])
                }
                client.end()
        })
    })
    user.psid = sender
    return user
}

function authExec(sender) {
    pg.connect(process.env.DATABASE_URL, function(err, client) {
        if (err) throw err
        client
            .query('SELECT id, psid, name FROM public.execs WHERE psid LIKE $1;', [sender], function(err, res) {
                if (res.rows[0] !== null) {
                    sendPayloadMessage(sender, payloadExecLoginSuccess)
                } else {
                    sendText(sender, "Your PSID is " + sender + ". Authentication failed.")
                }
                client.end()
            })
    })
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
            console.log("sendText(): Response body error.")
        }
    })
}

function sendPayloadMessage(sender, payload) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: token},
        method: "POST",
        json: {
            recipient: {id: sender},
            message: {
                attachment:
                {
                    type: "template",
                    payload: payload
                }
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Sending error.")
            console.log(response.body)
        } else if (response.body.error) {
            console.log("sendPayloadMessage(): Response body error.")
            console.log(response.body)
        }
    })
}

// Run app
app.listen(app.get('port'), function() {
    console.log("Running: port")
})

// Payloads
const payloadExecLoginSuccess = {
    template_type: "button",
    text: "You are successfully logged in.",
    buttons: [
      {
        type: "postback",
        title: "Continue",
        payload: "exec_portal"
      }
    ]
}

const payloadGreetingMessage = {
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
                    payload: "rental_requests"
                },{
                    type: "postback",
                    title: "Exec Portal",
                    payload: "auth_exec"
                }
            ]
        }
    ]
}

const payloadRequestsCategory = {
    template_type: "button",
    text: "Do you want to start a new request or manage an existing one?",
    buttons: [
      {
        type: "postback",
        title: "New Request",
        payload: "USER_DEFINED_PAYLOAD"
      },
      {
        type: "postback",
        title: "Existing Request",
        payload: "USER_DEFINED_PAYLOAD"
      },
      {
        type: "postback",
        title: "Go Back",
        payload: "hey"
      }
    ]
}

const payloadInventoryCategory = {
    template_type: "generic",
    elements: [
        {
            title: "Cameras",
            image_url: app_url + "images/cameras_bg.jpg",
            subtitle: "At the heart of the image.",
            buttons: [
                {
                    type: "postback",
                    title: "List of Cameras",
                    payload: "inventory_cameras"
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

const payloadCameraList = {
    template_type: "list",
    top_element_style: "compact",
    elements: [
        {
            title: "[CAN01] Canon 5D kit",
            image_url: app_url + "/images/canon_5d.jpg",
            subtitle: "Full-Frame, 13.2 Mpix, 3fps.\nDXO Sensor Mark: 71.",
            buttons: [
                {
                    type: "postback",
                    title: "Rent at $35",
                    payload: "USER_DEFINED_PAYLOAD"
                }
            ]
        },
        {
            title: "[CAN02] Canon T1i kit",
            image_url: app_url + "/images/canon_t1i.jpg",
            subtitle: "APS-C, 15.0 Mpix, 3fps.\nDXO Sensor Mark: 63.",
            buttons: [
                {
                    type: "postback",
                    title: "Rent at $35",
                    payload: "USER_DEFINED_PAYLOAD"
                }
            ]
        },
        {
            title: "[CAN03] Canon T3i kit",
            image_url: app_url + "/images/canon_t3i.jpg",
            subtitle: "APS-C, 18.7 Mpix, 3fps.\nDXO Sensor Mark: 65.",
            buttons: [
                {
                    type: "postback",
                    title: "Rent at $35",
                    payload: "USER_DEFINED_PAYLOAD"
                }
            ]
        },
        {
            title: "[NIK01] Nikon D7000 kit",
            image_url: app_url + "/images/nikon_d7000.jpg",
            subtitle: "APS-C, 16.3 Mpix, 6fps.\nDXO Sensor Mark: 80.",
            buttons: [
                {
                    type: "postback",
                    title: "Rent at $35",
                    payload: "USER_DEFINED_PAYLOAD"
                }
            ]
        }
    ],
    buttons: [
        {
            type: "postback",
            title: "Go Back",
            payload: "inventory_category"
        }
    ]
}
