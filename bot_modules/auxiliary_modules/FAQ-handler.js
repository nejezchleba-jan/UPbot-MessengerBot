const chatbotDB = require('../database_modules/chatbot-DB.js');
const contextHandler = require('../message_handling/context-handler.js');


async function checkForFAQMessage(headerInfo, contextObject) {
	let dynamicAnswers = ['odpovedFAQ'];
	if (contextObject.currentTopic === 'FAQ'
		&& dynamicAnswers.includes(contextObject.currentContext)) {
			return await prepareFAQMessage(headerInfo, contextObject);
	}
	return null;
}

module.exports = {
	checkForFAQMessage
}

async function prepareFAQMessage(defaultHeaderInfo, contextObject) {
	let FAQ = await chatbotDB.getFAQ(contextObject.lastMessage);
	let answer = null;
	let messageContent = null;
	let headerInfo = defaultHeaderInfo;
	if(FAQ.answerInTree) {
		answer = await chatbotDB.getAnswerWithIntent(FAQ.intent);
		headerInfo = await chatbotDB.getHeaderBySpecification(answer.specification);
		headerInfo.includesQuickReply = 1;
		headerInfo.returnAllowed = 0;
		headerInfo.conversationEnding = 1;
		messageContent = await chatbotDB.getAnswerContent(headerInfo.idHeader);
		contextObject.currentContext = answer.specification;
		contextObject.currentTopic = answer.topicName;
		await contextHandler.updateUserContext(contextObject);
	} else {
		messageContent = getFAQContent(headerInfo, FAQ);
    }
    return {headerInfo: headerInfo, contextObject: contextObject, messageContent: messageContent};
}

function getFAQContent(headerInfo, FAQ) {
	let messageContent = {};
	if(FAQ === undefined) {
		headerInfo.includesText = 1;
		messageContent['text'] = "Je mi líto, ale nenašel jsem odpověď na tvou otázku.";
		return messageContent;
	}
	if (FAQ.textAnswer !== null) {
		headerInfo.includesText = 1;
		messageContent['text'] = FAQ.textAnswer;
	}
	if (FAQ.urlAnswer !== null) {
		headerInfo.includesURL = 1;
		messageContent['url'] = FAQ.urlAnswer;
	}
	if (FAQ.videoAnswer !== null) {
		headerInfo.includesVideo = 1;
		messageContent['video'] = FAQ.videoAnswer;
	}
	if (FAQ.imageAnswer !== null) {
		headerInfo.includesIMG = 1;
		messageContent['img'] = FAQ.imageAnswer;
	}
	return messageContent;
}