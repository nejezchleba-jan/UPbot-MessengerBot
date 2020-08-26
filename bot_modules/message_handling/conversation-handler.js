const contextHandler = require('./context-handler.js');
const userMessageHandler = require('./user-message-handler.js');
const messageCreationHandler = require('./message-creation-handler.js');
const treeTraverser = require('../tree_modules/tree-traverser.js');
const api = require('./messenger-api.js');

async function initConversation() {
	await treeTraverser.initTrees();
}

async function handleConversation(userPSID, webhookEvent, messageTime) {
	let messageObject = userMessageHandler.extractUserMessage(webhookEvent);
	let contextObject = await contextHandler.getUserContext(userPSID);
	let botMessage = null;

	if (contextObject === undefined) {
		contextObject = await contextHandler.createUser(userPSID);
		await sendInfoMessage(contextObject, 'BOT', 'uvitaciZprava');
		contextObject.lastTimestamp = messageTime;
		contextObject = await goBackToMenu(contextObject);
	}

	contextObject = await lookForCommands(contextObject, messageObject);

	if (contextObject.answeringQuestion) {
		if(userReturned(contextObject.lastTimestamp)) {
			await sendInfoMessage(contextObject, 'BOT', 'vitejZpet');
		}
		contextObject.lastTimestamp = messageTime;
		contextObject = await handleUserAnswer(contextObject, messageObject);
	}
		
	botMessage = await messageCreationHandler.createMessage(contextObject);
	await sendMessage(contextObject, botMessage);
}

module.exports = {
	handleConversation,
	initConversation
}

function userReturned(lastTimestamp) {
	let currentTime = new Date();
	let oneDayUnixTime = 86400 * 1000;
	if((currentTime - lastTimestamp) >= oneDayUnixTime) return true;
	return false;
}

async function handleUserAnswer(contextObject, messageObject) {
	if(messageObject.type === "ATTACHMENTS") {
		return await handleUnknownAttachment(contextObject, messageObject); 
	}
	let validAnswer = contextHandler.isValidAnswer(contextObject, messageObject.content);
	if (validAnswer) {
		return await continueConversation(contextObject, validAnswer);
	} else if (messageObject.entities !== null) {
		return await handleNLP(contextObject, messageObject.entities);
	} else {
		await sendInfoMessage(contextObject, 'BOT', 'nerozpoznanaZprava');
		return await repeatQuestion(contextObject);
	}
}

async function handleUnknownAttachment(contextObject, messageObject) {
	await sendInfoMessage(contextObject, 'BOT', 'nerozpoznanaZprava');
	contextObject = await repeatQuestion(contextObject);
	return contextObject;
}

async function handleNLP(contextObject, entities) {
	let intent = entities.FAQ[0];
	if (intent.confidence >= process.env.WIT_CONFIDENCE_THRESHOLD) {
		contextObject.lastMessage = intent.value;
		contextObject.currentTopic = 'FAQ';
		contextObject.currentContext = 'odpovedFAQ';
		await contextHandler.updateUserContext(contextObject)
	} else {
		await sendInfoMessage(contextObject, 'BOT', 'nerozpoznanaZprava');
		contextObject = await repeatQuestion(contextObject);
	}
	return contextObject;
}

async function sendInfoMessage(contextObject, desiredTopic, desiredContext) {
	//Vytvoří dočasný kontext zkopírováním objektu
	let tempContext = JSON.parse(JSON.stringify(contextObject)); 
	tempContext.currentTopic = desiredTopic;
	tempContext.currentContext = desiredContext;
	let botMessage = await messageCreationHandler.createMessage(tempContext);
	await api.sendToMessenger(tempContext.idUser, botMessage);
}

async function sendMessage(contextObject, botMessage) {
	let messageSent = await api.sendToMessenger(contextObject.idUser, botMessage);
	if (messageSent) {
		contextObject.answeringQuestion = 1;
		await contextHandler.updateUserContext(contextObject);
	}
}

async function lookForCommands(contextObject, messageObject) {
	if (messageObject.type === 'TEXT_MESSAGE') {
		contextObject = await catchSpecialCommands(contextObject, messageObject.content);
	} else if (messageObject.type === 'QUICK_REPLY' || messageObject.type === 'POSTBACK') {
		contextObject = await catchSpecialReplies(contextObject, messageObject.content);
	}
	return contextObject;
}

async function catchSpecialCommands(contextObject, message) {
	if (message.startsWith('/')) {
		switch (message.toUpperCase()) {
			case '/MENU':
				await sendInfoMessage(contextObject, 'BOT', 'zmenaTema');
				contextObject = await goBackToMenu(contextObject);
				break;
			case '/REPEAT':
				contextObject = await repeatQuestion(contextObject);
				break;
			case '/HELP':
				await sendInfoMessage(contextObject, 'HELP', 'pomocInfo');
				contextObject = await repeatQuestion(contextObject);
				break;
		}
	}
	return contextObject;
}

async function catchSpecialReplies(contextObject, message) {
	switch (message) {
		case 'MENU':
			await sendInfoMessage(contextObject, 'BOT', 'zmenaTema');
			contextObject = await goBackToMenu(contextObject);
			break;
		case 'RETURN':
			contextObject = await returnToPrevious(contextObject);
			break;
		case 'HELP':
			await sendInfoMessage(contextObject, 'HELP', 'pomocInfo');
			contextObject = await goBackToMenu(contextObject);
			break;
	}
	return contextObject;
}

async function continueConversation(contextObject, validAnswer) {
	contextObject.lastMessage = validAnswer;
	switch (contextObject.currentTopic) {
		case 'MAINMENU':
			await contextHandler.switchTopic(contextObject, validAnswer);
			break;
		case 'OBORY':
			await contextHandler.switchOboryContext(contextObject, validAnswer);
			break;
		case 'TESTY':
			await contextHandler.switchTestyContext(contextObject, validAnswer);
			break;
		default:
			await contextHandler.switchContext(contextObject, 'FORWARD');
			break;
	}
	await contextHandler.updateUserContext(contextObject);
	return contextObject;
}

async function goBackToMenu(contextObject) {
	contextObject.lastMessage = null;
	let newContext = await contextHandler.switchTopic(contextObject, 'MAINMENU');
	await contextHandler.updateUserContext(newContext);
	return newContext;
}

async function repeatQuestion(contextObject) {
	contextObject.answeringQuestion = 0;
	await contextHandler.updateUserContext(contextObject);
	return contextObject;
}

async function returnToPrevious(contextObject) {
	let newContext = await contextHandler.switchContext(contextObject, 'BACK');
	await contextHandler.updateUserContext(newContext);
	return newContext;
}