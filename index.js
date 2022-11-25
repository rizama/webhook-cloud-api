require('dotenv').config();
const express = require('express');
const axios = require('axios');
const ACCESS_TOKEN_MB = process.env.ACCESS_TOKEN_MB;
const messagebird = require('messagebird')(ACCESS_TOKEN_MB);

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

app.post('/webhook', async (req, res) => {
    const body = req.body;

    // console.log(JSON.stringify(body, null, 2), "debug");
    // console.log('debug on');

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
            const msg_id = changes.value.messages[0].id;
            const contact_name =
                changes.value.contacts[0].profile.name || 'stranger';
            const url = `https://graph.facebook.com/v15.0/${phone_id}/messages?access_token=${ACCESS_TOKEN}`;

            console.log(phone_id, '*phone_id');
            console.log(from, '*from');
            console.log(msg_body, '*msg_body');
            console.log(ACCESS_TOKEN, 'access_token');
            console.log(
                'https://graph.facebook.com/v15.0/' +
                    phone_id +
                    '/messages?access_token=' +
                    ACCESS_TOKEN,
                'url'
            );

            // Mark as Read
            await axios({
                method: 'POST',
                url:
                    'https://graph.facebook.com/v15.0/' +
                    phone_id +
                    '/messages',
                data: {
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: msg_id,
                },
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            });

            // Reply the message
            if (msg_body?.toLowerCase() === 'cek resi') {
                const tokpedHalu = 10000;
                const tokpedGokil = 50000;
                const data = {
                    tokpedHalu,
                    tokpedGokil,
                };
                const urlCheckAwb = `https://graph.facebook.com/v15.0/${phone_id}/messages`;
                await checkAwb(ACCESS_TOKEN, from, urlCheckAwb, data);
            } else {
                await defaultReply(contact_name, msg_body, url, from);
            }

            res.sendStatus(200);
        } else {
            res.sendStatus(403);
        }
    }
});

async function defaultReply(contact_name, msg_body, url, from) {
    try {
        // Reply the message
        await axios({
            method: 'POST',
            url: url,
            data: {
                messaging_product: 'whatsapp',
                to: from,
                text: {
                    body: `Hi ${contact_name}, your message is ${msg_body}`,
                },
            },
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.log(error);
    }
}

async function checkAwb(ACCESS_TOKEN, from, url, data) {
    try {
        await axios({
            method: 'POST',
            url: url,
            data: {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: from,
                type: 'template',
                template: {
                    name: 'status_resi',
                    language: {
                        code: 'id',
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                {
                                    type: 'text',
                                    text: `${data.tokpedHalu}`,
                                },
                                {
                                    type: 'text',
                                    text: `${data.tokpedGokil}`,
                                },
                            ],
                        },
                    ],
                },
            },
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
        });
    } catch (error) {
        console.log(error);
    }
}

app.get('/', (req, res) => {
    res.status(200).send('welcome to whatsapp webhook cloud api!');
});

// Webhook message bird
app.get('/message-bird/webhook', (req, res) => {
    const body = req.body;
    const headers = req.headers;

    console.log(JSON.stringify(body, null, 2), '*Body');

    res.status(200).send('/message-bird/webhook GET');
});

app.post('/message-bird/webhook', async (req, res) => {
    const body = req.body;
    const headers = req.headers;

    console.log(JSON.stringify(body, null, 2), '*Body Webhook');

    const contactName = body?.contact?.displayName ?? 'Stranger';
    const messageDestination = body?.message?.from ?? null;
    const messageChannelId = body?.message?.channelId ?? null;
    const messageContent = body?.message?.content?.text ?? null;

    const data = {
        contactName, 
        messageDestination,
        messageChannelId,
        messageContent
    }

    console.log(JSON.stringify(data, null, 2), '*data Webhook');

    if (messageDestination) {
        const params = {
            to: `${messageDestination}`, // destination number
            from: `${messageChannelId}`, // channel id
            type: 'text',
            content: {
                text: `Hello ${contactName}, your message is ${messageContent}`, // message
            },
            reportUrl: 'https://example.com/reports',
        };
    
        await messagebird.conversations.send(params, function (err, response) {
            if (err) {
            return console.log(err);
            }
            console.log(response);
        });
    }

    res.status(200).send('ok');
});

app.post('/message-bird/webhook-1', (req, res) => {
    const body = req.body;
    const headers = req.headers;

    console.log(JSON.stringify(body, null, 2), '*Body Webhook 1');

    res.status(200).send('/message-bird/webhook POST WEBHOOK 1');
});
