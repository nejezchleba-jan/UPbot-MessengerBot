'use strict';

var CONVERSATION_TREES = null;

const initTrees = async () => {
	CONVERSATION_TREES = await require("./conversation-tree").initConversationTrees();
}

const getTopicStart = function (topic) {
	let tree = getTreeForTopic(topic);
	if (tree !== null) {
		return tree._root.context;
	}
	return null;
}

const getPreviousContext = function (topic, currentContext) {
	let foundContext = findCurrentContext(topic, currentContext);
	if (foundContext !== null) return foundContext.parent.context;
	return null;
}

const getNextContext = function (topic, currentContext, choice) {
	let foundContext = findCurrentContext(topic, currentContext);
	let foundChild = null;
	if (foundContext !== null) {
		foundChild = searchForChildWithChoice(foundContext.children, choice);
		if (foundChild !== null) {
			return foundChild.context;
		}
	}
	return null;
}

const getPossibleAnswers = function (topic, contextName) {
	let foundContext = findCurrentContext(topic, contextName);
	if (foundContext !== null) return foundContext.choices;
	return null;
}


const getHeader = function (topic, contextName) {
	let foundContext = findCurrentContext(topic, contextName);
	if (foundContext !== null) return foundContext.header;
	return null;
}

const getQuickReplies = function (topic, contextName) {
	let foundContext = findCurrentContext(topic, contextName);
	if (foundContext !== null) return foundContext.quickReplies;
	return null;
}

const getContent = function (topic, contextName) {
	let foundContext = findCurrentContext(topic, contextName);
	if (foundContext !== null) {
		return foundContext.contents[Math.floor(Math.random()*foundContext.contents.length)];
	}
	return null;
}

module.exports = {
	initTrees,
	getTopicStart,
	getPreviousContext,
	getNextContext,
	getPossibleAnswers,
	getHeader,
	getQuickReplies,
	getContent
}

function getTreeForTopic(topic) {
	let tree = CONVERSATION_TREES[topic];
	if (tree === undefined) return null;
	return tree;
}


function searchForChildWithChoice(children, currentChoice) {
	let foundChild = null;
	children.forEach(child => {
		let found = child.lastChoices.find(choice => choice === currentChoice);
		if (found) {
			foundChild = child;
			return;
		}
	});
	return foundChild;
}

function findCurrentContext(topic, contextName) {
	let tree = getTreeForTopic(topic);
	let foundContext = null;
	if (tree !== null) {
		tree.contains(function (node) {
			if (node.context === contextName) {
				foundContext = node;
			}
		}, tree.traverseBF);
	}
	return foundContext;
}