const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

// https://stackoverflow.com/questions/47232187/express-json-vs-bodyparser-json/47232318#47232318
app.use(express.json());

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const MY_TOKEN = process.env.MY_TOKEN;

app.listen(process.env.PORT || 8080, () => {
    console.log('Webhook is listening');
});

// to verify the callback url from dashboard side
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const challenge = req.query['hub.challenge'];
    const token = req.query['hub.verify_token'];

    console.log(`mode = ${mode}`);
    console.log(`challenge = ${challenge}`);
    console.log(`token = ${token}`);

    if (mode && token) {
        if (mode === 'subscribe' && token === MY_TOKEN) {
            return res.status(200).send(challenge);
        } else {
            return res.status(403);
        }
    }
});

app.post('/webhook', (req, res) => {
    const body = req.body;

    console.log(JSON.stringify(body, null, 2));

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const changes = body.entry[0].changes[0];

            const phone_id = changes.value.metadata.phone_number_id;
            const from = changes.value.messages[0].from;
            const msg_body = changes.value.messages[0].text.body;

            console.log(phone_id, "*phone_id")
            console.log(from, "*phone_id")
            console.log(msg_body, "*phone_id")
            console.log(ACCESS_TOKEN, "access_token");
            
            axios.post({
                method: 'POST',
                url: `https://graph.facebook.com/v15.0/${phone_id}/messages?access_token=${ACCESS_TOKEN}`,
                data: {
                    messaging_product: 'whatsapp',
                    to: from,
                    text: {
                        body: `Hi Sam, your message is ${msg_body}`,
                    }
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return res.sendStatus(200);
        } else {
            return res.sendStatus(403);
        }
    }
});

app.get('/', (req, res) => {
    res.status(200).send('welcome to whatsapp webhook cloud api!')
});
