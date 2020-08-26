const extractUserMessage = function (rawEvent) {
	let messageType = getMessageType(rawEvent);
	let messageContent = getMessageContent(messageType, rawEvent);
	let messageInfo = { type: messageType, content: messageContent, entities: null };
	if (messageInfo.type === 'TEXT_MESSAGE'
		&& Object.entries(rawEvent.message.nlp.entities).length !== 0) {
		messageInfo.entities = rawEvent.message.nlp.entities;
	}
	return messageInfo;
}

module.exports = {
	extractUserMessage
}


function getMessageType(rawEvent) {
	if (rawEvent.message) {
		if (rawEvent.message.quick_reply) {
			return 'QUICK_REPLY';
		} else if (rawEvent.message.attachments) {
			return 'ATTACHMENTS'
		}
		return 'TEXT_MESSAGE';
	} else if (rawEvent.postback) {
		return 'POSTBACK';
	} else {
		return 'UNKNOWN';
	}
}


function getMessageContent(messageType, rawEvent) {
	let messageContent = null;
	switch (messageType) {
		case 'TEXT_MESSAGE': messageContent = rawEvent.message.text;
			break;
		case 'QUICK_REPLY': messageContent = rawEvent.message.quick_reply.payload;
			break;
		case 'ATTACHMENTS': messageContent = rawEvent.message.attachments; //nějak spešl vyřešit asi
			break;
		case 'POSTBACK': messageContent = rawEvent.postback.payload;
			break;
		default:
			break;
	}
	return messageContent;
}
