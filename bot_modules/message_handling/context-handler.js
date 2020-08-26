const contextDB = require('../database_modules/context-DB.js');
const treeTraverser = require('../tree_modules/tree-traverser.js');
const resourceDB = require('../database_modules/resource-DB.js');


//CONTEXT
async function getUserContext(userPSID) {
	let contextObject = await contextDB.getUserContext(userPSID);
	return contextObject;
}

async function createUser(userPSID) {
	await contextDB.createUserContext(userPSID, null, null, null, 0, 0);
	await contextDB.createUserTestsContext(userPSID);
	return await getUserContext(userPSID);
}

async function updateUserContext(contextObject) {
	await contextDB.updateUserContext(
		contextObject.idUser,
		contextObject.currentTopic,
		contextObject.currentContext,
		contextObject.lastMessage,
		contextObject.answeringQuestion,
		contextObject.chosenField,
		contextObject.chosenStudy,
		contextObject.lastTimestamp);
}

function isValidAnswer(contextObject, message) {
	let result = false;
	let possibleAnswers = treeTraverser.getPossibleAnswers(
		contextObject.currentTopic,
		contextObject.currentContext);
	if (possibleAnswers !== null) {
		result = possibleAnswers.find(element => element === message.toUpperCase());
		if (result === undefined) return false;
	}
	return result;
}

function switchOboryContext(contextObject) {
	if (contextObject.currentContext === 'oboryStudium') {
		contextObject.chosenStudy = contextObject.lastMessage;
	} else if (contextObject.currentContext === 'oboryVyber') {
		contextObject.chosenField = contextObject.lastMessage;
	}
	return switchContext(contextObject, 'FORWARD');
}

function switchTopic(contextObject, chosenTopic) {
	contextObject.currentTopic = chosenTopic;
	return switchContext(contextObject, 'START');
}

function switchContext(contextObject, direction) {
	if (direction === 'BACK') {
		contextObject.currentContext = treeTraverser.getPreviousContext(
			contextObject.currentTopic,
			contextObject.currentContext);
	} else if (direction === 'FORWARD') {
		contextObject.currentContext = treeTraverser.getNextContext(
			contextObject.currentTopic,
			contextObject.currentContext,
			contextObject.lastMessage);
	} else if (direction === 'START') {
		contextObject.currentContext = treeTraverser.getTopicStart(contextObject.currentTopic);
	}
	contextObject.answeringQuestion = 0;
	return contextObject;
}

async function switchTestyContext(contextObject, validAnswer) {
	let testContext = await contextDB.getTestContext(contextObject.idUser);
	switch (contextObject.currentContext) {
		case 'testyStahnoutVyber':
			await contextDB.setTestType(testContext.idUser, validAnswer);
			break;
		case 'testyVyber':
			let questionCount = await resourceDB.getTestQuestionCount(validAnswer);
			await contextDB.setTestType(testContext.idUser, validAnswer);
			await contextDB.setQuestionCount(testContext.idUser, questionCount.questionCount);
			await contextDB.setCurrentQuestion(testContext.idUser, 1);
			break;
		case 'testyOtazka':
			return await handleSkipQuestion(contextObject, testContext, validAnswer);
		case 'testySpravnaOdpoved':
			return await handleNextQuestion(contextObject, testContext, validAnswer);
		case 'testySpatnaOdpoved':
			return await handleNextQuestion(contextObject, testContext, validAnswer);
	}
	return await switchContext(contextObject, 'FORWARD');
}

module.exports = {
	getUserContext,
	createUser,
	updateUserContext,
	isValidAnswer,
	switchTopic,
	switchContext,
	switchOboryContext,
	switchTestyContext
}

//POMOCNÉ FUNKCE PRO TESTY
async function handleNextQuestion(contextObject, testContext, validAnswer) {
	if (validAnswer === 'NEXT_QUESTION' && testContext.questionCount !== testContext.currentQuestion) {
		let newQuestion = testContext.currentQuestion + 1;
		await contextDB.setCurrentQuestion(testContext.idUser, newQuestion);
		return await switchContext(contextObject, 'BACK'); //návrat k testyOtazka s novým obsahem
	} else if (validAnswer === 'TRY_AGAIN') {
		return await switchContext(contextObject, 'BACK');
	} else {
		contextObject.lastMessage = 'KONECSPATNAODPOVED';
		contextObject.currentContext = 'konecSpatnaOdpoved';
		contextObject.answeringQuestion = 0;
		return contextObject;
	}
}

async function handleSkipQuestion(contextObject, testContext, validAnswer) {
	if (validAnswer === 'NEXT_QUESTION' && testContext.questionCount !== testContext.currentQuestion) {
		let newQuestion = testContext.currentQuestion + 1;
		await contextDB.setCurrentQuestion(testContext.idUser, newQuestion);
		contextObject.answeringQuestion = 0;
		return contextObject;
	} else if (validAnswer !== 'NEXT_QUESTION') {
		return await switchContext(contextObject, 'FORWARD');
	} else {
		contextObject.lastMessage = 'KONECSPRAVNAODPOVED';
		contextObject.currentContext = 'konecSpravnaOdpoved'
		contextObject.answeringQuestion = 0;
		return contextObject;
	}
}
