const treeTraverser = require('../tree_modules/tree-traverser.js');
const carouselHandler = require('../auxiliary_modules/carousel-handler.js');
const testHandler = require('../auxiliary_modules/tests-handler.js');
const fieldsHandler = require('../auxiliary_modules/fields-handler.js');
const FAQHandler = require('../auxiliary_modules/FAQ-handler.js');
const api = require('./messenger-api.js');


async function createMessage(contextObject) {
	let headerInfo = await treeTraverser.getHeader(contextObject.currentTopic, contextObject.currentContext);
	let messageContent = null;
	let dynamicMessage = await checkForDynamicMessage(headerInfo, contextObject);
	
	if(dynamicMessage !== null) return dynamicMessage;
	messageContent = await treeTraverser.getContent(contextObject.currentTopic, contextObject.currentContext);
	return await generateMessage(headerInfo, contextObject, messageContent);
}

async function checkForDynamicMessage(headerInfo, contextObject){
	let tests = await testHandler.checkForTestMessage(headerInfo, contextObject);
	let fields = await fieldsHandler.checkForFieldsMessage(headerInfo, contextObject);
	let FAQ = await FAQHandler.checkForFAQMessage(headerInfo, contextObject);
	if(tests !== null) return tests;
	if(fields !== null) return fields;
	if(FAQ !== null) return await generateMessage(FAQ.headerInfo, FAQ.contextObject, FAQ.messageContent);
	return null;
}

module.exports = {
	createMessage
}

async function generateMessage(headerInfo, contextObject, messageContent) {
	let message = {};
	if (headerInfo.isCarousel) {
		let carouselElements = await carouselHandler.getCarouselElements(contextObject);
		message['attachment'] = api.createCarousel(carouselElements);
	} else if (headerInfo.includesText && headerInfo.includesURL) {
		message['attachment'] = api.createURLButton(messageContent);
	} else if (headerInfo.includesText) {
		message['text'] = messageContent.text;
	} else if (headerInfo.includesIMG) {
		message['attachment'] = api.createSimpleAttachment('image', messageContent.img);
	} else if (headerInfo.includesVideo) {
		message['attachment'] = api.createSimpleAttachment('video', messageContent.video);
	} else if (headerInfo.includesURL) {
		message['text'] = messageContent.url;
	}

	if (headerInfo.includesQuickReply) {
		let quickReplies = await treeTraverser.getQuickReplies(contextObject.currentTopic, contextObject.currentContext);
		message['quick_replies'] = api.createQuickReplies(headerInfo, quickReplies);
	}
	return message;
}