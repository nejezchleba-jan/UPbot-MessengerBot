"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const conversationHandler = require('./bot_modules/message_handling/conversation-handler.js');

var CHATBOT_IS_RUNNING = false;

var chatbot = express();
chatbot.use(bodyParser.json());
chatbot.use(bodyParser.urlencoded({ extended: false }));
chatbot.listen(process.env.CHATBOT_PORT || 3000, () => {
	console.log('START_LOG: CHATBOT is listening on PORT: ' + process.env.CHATBOT_PORT);
});

const startChatbot = async() => {
	CHATBOT_IS_RUNNING = true;
	await conversationHandler.initConversation();
	console.log("CHATBOT_LOG: Chatbot is running.");
}

const restartChatbot = async() => {
	await conversationHandler.initConversation();
	console.log("CHATBOT_LOG: Chatbot was restarted.");
}

const stopChatbot = async() => {
	CHATBOT_IS_RUNNING = false;
	console.log("CHATBOT_LOG: Chatbot was stopped.");
}

const getState = () => {
	return CHATBOT_IS_RUNNING;
}

function validateConnection(req, res) {
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];

	if (mode && token) {
		if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
			console.log('CHATBOT_LOG: Webhook verified. Connection to Messenger established.');
			res.status(200).send(challenge);
		} else {
			console.log('CHATBOT_ERROR: Connection to Messenger refused.');
			res.sendStatus(403);
		}
	}
};

function handleEvents(req, res) {
	if (!CHATBOT_IS_RUNNING) {
		// Pokud neběží pouze potvrdí přijetí zprávy
		res.status(200).send('EVENT_RECEIVED');
		return;
	} else {
		let body = req.body;
		// Kontrola zda přišla zpráva ze stránky
		if (body.object === 'page') {
			body.entry.forEach(function (entry) {
				// Získá tělo události
				let webhookEvent = entry.messaging[0];
				let senderPSID = webhookEvent.sender.id;	
				let messageTime = entry.time;
				// Zašle data ke zpracování vnitřní logikou chatbota (ignoruje zpětné zprávy o doručení)
				if (webhookEvent.message || webhookEvent.postback) {
					conversationHandler.handleConversation(senderPSID, webhookEvent, messageTime);
				}
			});
			// Vrací '200 OK' odpověď na všechny přijaté zprávy
			res.status(200).send('EVENT_RECEIVED');
		} else {
			res.sendStatus(404);
		}
	}
}

//Ověření webhooku
chatbot.get('/webhook', (req, res) => {
	validateConnection(req, res);
});

//Příchozí události na webhook z Messengeru se přepošlou chatbotovi
chatbot.post('/webhook', (req, res) => {
	handleEvents(req, res);
});

module.exports = {
	startChatbot,
	stopChatbot,
	restartChatbot,
	getState
}