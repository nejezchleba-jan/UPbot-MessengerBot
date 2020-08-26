"use strict";

const DBClass = require('../../database_util_modules/database-class.js');
const pathToDatabase = ('./databases/chatbot_answers.db');
const database = new DBClass(pathToDatabase);

class ChatbotDBClass {
	constructor(database) {
		this.database = database
	}

	/* PRO TVORBU STROMU */
	getPossibleTopics() {
		return this.database.all(
			`SELECT topicName FROM topics ORDER by topicName`);
	}

	getAnswerNodes() {
		return this.database.all(
			`SELECT * FROM answerNodes NATURAL JOIN topics`);
	}

	getAllHeaders() {
		return this.database.all(`SELECT * FROM answerHeaders`);
	}

	getAllQuickReplies() {
		return this.database.all(`SELECT * FROM answerQuickReplies`);
	}

	getAllContents() {
		return this.database.all(`SELECT * FROM answerContents`);
	}

	/* PRO TVORBU FAQ */
	getFAQ(intent) {
		return this.database.get(
			`SELECT * FROM faq WHERE intent = ?`,
			[intent]);
	}
	
	getAnswerHeaderById(idHeader) {
		return this.database.get(
			`SELECT * FROM answerHeaders WHERE answerHeaders.idHeader = ?`,
			[idHeader]);
	}

	getAnswerWithIntent(intent) {
		return this.database.get(
			`SELECT * FROM answerNodes NATURAL JOIN topics WHERE answerNodes.asociatedIntent = ?`,
			[intent]);
	}

	getAnswerContent(idHeader) {
		return this.database.get(
			`SELECT * FROM answerContents WHERE idHeader = ? ORDER BY RANDOM() LIMIT 1`,
			[idHeader]);
	}

	
	/* WEB */
	getHeaderBySpecification(specification) {
		return this.database.get(
			`SELECT * FROM answerHeaders WHERE headerSpecification = ?`,
			[specification]);
	}

	getIntentsbyTopic(idTopic) {
		return this.database.all(
			`SELECT asociatedIntent FROM answerNodes WHERE idTopic = ?`,
			[idTopic]);
	}

	getAnswerQuickReplies(idHeader) {
		return this.database.all(
			`SELECT * FROM answerQuickReplies WHERE idHeader = ?`,
			[idHeader]);
	}

	getAllQuickReplies() {
		return this.database.all(`SELECT * FROM answerQuickReplies ORDER BY idQR`);
	}

	getAllContents() {
		return this.database.all(`SELECT * FROM answerContents`);
	}

	getTopic(idTopic) {
		return this.database.get(`SELECT * FROM topics WHERE idTopic = ?`,
			[idTopic]);
	}

	getTopicQuickReply(temaVyberHeader, rootConnectedChoice) {
		return this.database.get(`SELECT * FROM answerQuickReplies WHERE idHeader=? AND payload=?`,
			[temaVyberHeader, rootConnectedChoice]);
	}

	getContextsForTopic(idTopic) {
		return this.database.all(`SELECT idTopic, specification FROM answerNodes WHERE idTopic=? ORDER BY specification`,
			[idTopic]);
	}
	
	getEditableTopics() {
		return this.database.all(`SELECT * FROM topics WHERE topicName NOT IN ('MAINMENU', 'BOT', 'FAQ', 'CHANGE', 'UNKNOWN') ORDER BY topicName`);
	}

	getUserTopics() {
		return this.database.all(`SELECT * FROM topics WHERE topicName NOT IN ('MAINMENU', 'BOT', 'FAQ', 'HELP', 'TESTY', 'OBORY') ORDER BY topicName`);
	}

	getContextsForUserTopics() {
		return this.database.all(`SELECT idTopic, specification, parentSpecification FROM topics NATURAL JOIN answerNodes WHERE topicName NOT IN ('MAINMENU', 'BOT', 'FAQ', 'HELP', 'TESTY', 'OBORY') ORDER BY specification`);
	}

	getCoreTopics() {
		return this.database.all(`SELECT * FROM topics WHERE topicName IN ('MAINMENU', 'BOT', 'FAQ', 'HELP', 'TESTY', 'OBORY') ORDER BY topicName`);
	}

	getContextsForCoreTopics() {
		return this.database.all(`SELECT idTopic, specification FROM topics NATURAL JOIN answerNodes WHERE topicName IN ('MAINMENU', 'BOT', 'FAQ', 'HELP', 'TESTY', 'OBORY') ORDER BY specification`)
	}
	
	getAvailableParentSpec() {
		return this.database.all(`SELECT idTopic, specification FROM topics NATURAL JOIN answerNodes WHERE topicName NOT IN ('MAINMENU', 'BOT', 'FAQ', 'CHANGE', 'UNKNOWN', 'TESTY', 'OBORY') ORDER BY specification`);
	}
	
	getRootForTopic(idTopic) {
		return this.database.get(`SELECT * FROM answerNodes, answerHeaders, answerContents WHERE parentSpecification IS NULL 
									AND answerNodes.specification = answerHeaders.headerSpecification 
									AND answerHeaders.idHeader = answerContents.idHeader
									AND answerNodes.idTopic = ?`,
			[idTopic]);
	}

	getContextQuickReply(idHeader, connectedChoice) {
		return this.database.get(`SELECT * FROM answerQuickReplies WHERE idHeader=? AND payload=?`,
			[idHeader, connectedChoice]);
	}

	getContentVariants(idHeader) {
		return this.database.all(`SELECT * FROM answerContents WHERE idHeader=?`, 
			[idHeader])
	}

	getContextDirectChildren(specification) {
		return this.database.all(`SELECT specification FROM answerNodes WHERE parentSpecification=?`, 
			[specification])
	}
}
const ChatbotDB = new ChatbotDBClass(database);

module.exports = ChatbotDB;