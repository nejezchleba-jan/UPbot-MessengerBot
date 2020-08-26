const resourceDB = require('../database_modules/resource-DB.js');
const treeTraverser = require('../tree_modules/tree-traverser.js');
const api = require('../message_handling/messenger-api.js');

async function checkForFieldsMessage(headerInfo, contextObject) {
	let dynamicAnswers = ['oboryInfo'];
	if (contextObject.currentTopic === 'OBORY'
		&& dynamicAnswers.includes(contextObject.currentContext)) {
			return await generateFieldsMessage(headerInfo, contextObject, contextObject.lastMessage);
	}
	return null;
}

module.exports = {
	checkForFieldsMessage
}

async function generateFieldsMessage(headerInfo, contextObject) {
	let fieldDetail = await resourceDB.getFieldById(contextObject.chosenField);
	let message = {};
	switch (contextObject.lastMessage) {
		case 'MAINDESC':
			message['text'] = fieldDetail.mainDescription;
			break;
		case 'STUDYDESC':
			message['text'] = fieldDetail.studiesDescription;
			break;
		case 'APPLIDESC':
			message['text'] = fieldDetail.applicationDescription;
			break;
		case 'SUITABLE':
			message['text'] = fieldDetail.suitableFor;
			break;
		case 'KOMBI':
			if (fieldDetail.canCombi) {
				message['text'] = 'Obor ' + fieldDetail.fieldName + ' můžeš studovat kombinovaně.';
			} else {
				message['text'] = 'U oboru ' + fieldDetail.fieldName + ' je možná pouze prezenční forma studia.';
			}
			break;
	}
	if (headerInfo.includesQuickReply) {
		let quickReplies = await treeTraverser.getQuickReplies(contextObject.currentTopic, contextObject.currentContext);
		message['quick_replies'] = api.createQuickReplies(headerInfo, quickReplies);
	}
	return message;
}