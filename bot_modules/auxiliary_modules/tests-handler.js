"use strict";
const contextDB = require('../database_modules/context-DB.js');
const resourceDB = require('../database_modules/resource-DB.js');
const api = require('../message_handling/messenger-api.js');

async function checkForTestMessage(headerInfo, contextObject) {
	let dynamicAnswers = ['testyOtazka', 'testyInfo', 'testyStahnout'];
	if (contextObject.currentTopic === 'TESTY'
		&& dynamicAnswers.includes(contextObject.currentContext)) {
			return await generateTestMessage(headerInfo, contextObject, contextObject.lastMessage);
	}
	return null;
}

module.exports = {
	checkForTestMessage,
}

async function generateTestMessage(headerInfo, contextObject, validAnswer) {
	let testContext = await contextDB.getTestContext(contextObject.idUser);
	let testQuestion = await resourceDB.getTestQuestion(testContext.currentQuestion, testContext.testCollection);
	if (contextObject.currentContext === 'testyOtazka') return createTestQuestion(testQuestion);
	if (contextObject.currentContext === 'testyInfo') return await createTestInfo(headerInfo, validAnswer);
	if (contextObject.currentContext === 'testyStahnout') return await createTestDownload(headerInfo, validAnswer);
}

async function createTestDownload(headerInfo, validAnswer) {
	let message = {};
	let testURL = await resourceDB.getCollectionURL(validAnswer);
	if (testURL !== null) {
		message['attachment'] = api.createURLButton({ text: 'Přeji hodně zdaru při řešení. ✌', url: testURL.collectionURL });
	} else {
		message['text'] = 'Bohužel jsem nenašel odkaz na tento test. 😔';
	}
	message['quick_replies'] = api.createQuickReplies(headerInfo, null);
	return message;
}

async function createTestInfo(headerInfo, validAnswer) {
	let message = {};
	let testInfo = await resourceDB.getCollectionInfo(validAnswer);
	if (testInfo.collectionInfo !== null) {
		message['text'] = testInfo.collectionInfo;
	} else {
		message['text'] = 'K tomuto testu nejsou žádné konkrétní instrukce. 😃 Můžeš ho spustit tlačítkem níže: ';
	}
	message['quick_replies'] = api.createQuickReplies(headerInfo, [{ text: "Spustit test", payload: 'BEGIN_TEST' }]);
	return message;
}


function createTestQuestion(testQuestion) {
	let message = {};
	let counter = 0;
	let QR = [];
	let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
	let selectedLetter = null;
	while (counter < testQuestion.answerCount) {
		selectedLetter = letters[counter];
		let letter = "(" + selectedLetter + ")";
		if (selectedLetter !== testQuestion.correctAnswer) {
			QR.push({ content_type: "text", title: letter, payload: "WRONG_ANSWER" });
		} else {
			QR.push({ content_type: "text", title: letter, payload: "RIGHT_ANSWER" });
		}
		counter++;
	}
	QR.push({ content_type: "text", title: "Přeskočit", payload: "NEXT_QUESTION" });
	if (testQuestion.img !== null) {
		message['attachment'] = api.createSimpleAttachment('image', testQuestion.img);
	} else {
		message['text'] = testQuestion.text;
	}
	message['quick_replies'] = QR;
	return message;
}