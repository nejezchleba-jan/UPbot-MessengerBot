"use strict";
const sqlite3 = require('./sqlite-async.js');
const pathToDatabase = ('./databases/chatbot_answers.db');

//--WORKER SETUP--
function setupWorkerConn() {
	return new sqlite3.Database(pathToDatabase, sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
			throw new Error('Invalid database connection.')
		}
	});
}

//--TRANSACTIONS--

//--CREATE TOPIC TRANSACTION--
async function createChatbotTopic(loadedData) {
	let results = null;
	let newchoices = null;
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		results = await createTopic(db, loadedData);
		loadedData.topic["idTopic"] = results.lastID;
		await createNode(db, loadedData);
		await createQuickReplyForTopic(db, loadedData);
		results = await createHeader(db, loadedData);
		loadedData.header["idHeader"] = results.lastID;
		await createContent(db, loadedData);
		results = await getMenuChoices(db);
		newchoices = JSON.parse(results.possibleChoices);
		newchoices.choices.push(loadedData.qr.payload);
		await changeTopicMenu(db, JSON.stringify(newchoices));
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Transaction aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

//--DELETE TOPIC TRANSACTION--
async function deleteChatbotTopic(idTopic) {
	let results = null;
	let newchoices = null;
	let index = null;
	let topicToDelete = null;
	let db = setupWorkerConn();
	try {
		await db.runAsync("PRAGMA foreign_keys = ON;");
		await db.runAsync("BEGIN TRANSACTION;");
		topicToDelete = await getTopic(db, idTopic);
		results = await getMenuChoices(db);
		newchoices = JSON.parse(results.possibleChoices);
		index = newchoices.choices.indexOf(topicToDelete.topicName);
		if (index > -1) newchoices.choices.splice(index, 1);
		await deleteTopicMenuReply(db, topicToDelete.topicName);
		await changeTopicMenu(db, JSON.stringify(newchoices));
		await deleteTopic(db, idTopic);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Transaction aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

//--UPDATE TOPIC TRANSACTION--
async function updateChatbotTopic(idTopic, topicName, quickReply) {
	let oldTopic = null;
	let newchoices = null;
	let results = null;
	let index = null;
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		oldTopic = await getTopic(db, idTopic);
		await updateTopicName(db, idTopic, topicName);
		await updateTopicReply(db, quickReply, topicName, oldTopic.topicName);
		results = await getMenuChoices(db);
		newchoices = JSON.parse(results.possibleChoices);
		index = newchoices.choices.indexOf(oldTopic.topicName);
		if (index > -1) newchoices.choices[index] = topicName;
		await changeTopicMenu(db, JSON.stringify(newchoices));
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Transaction aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

//--CREATE ANSWER TRANSACTION--
async function createChatbotAnswer(loadedData) {
	let results = null;
	let newchoices = null;
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		//topic
		results = await getTopicByName(db, loadedData.topic.topicName);
		loadedData.topic.idTopic = results.idTopic;
		//node
		await createNode(db, loadedData);
		//header
		results = await createHeader(db, loadedData);
		loadedData.header["idHeader"] = results.lastID;
		//content
		await createContent(db, loadedData);
		//quickReply
		results = await getParentIdHeader(db, loadedData.node.parentSpecification);
		loadedData.node["parentHeader"] = results.idHeader;
		await createQuickReply(db, loadedData);
		//parent choices
		results = await getParentChoices(db, loadedData.node.parentSpecification);
		newchoices = ((results.possibleChoices === null) ? { choices: [] } : JSON.parse(results.possibleChoices));
		newchoices.choices.push(loadedData.qr.payload);
		await changeParentChoices(db, loadedData.node.parentSpecification, JSON.stringify(newchoices));
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Transaction aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}


//--DELETE ANSWER TRANSACTION
async function deleteChatbotAnswer(specification) {
	let results = null;
	let newchoices = null;
	let index = null;
	let parentSpecification = null;
	let db = setupWorkerConn();
	try {
		await db.runAsync("PRAGMA foreign_keys = ON;");
		await db.runAsync("BEGIN TRANSACTION;");
		//delete from parent
		parentSpecification = (await getParent(db, specification)).parentSpecification;
		results = await getParentChoices(db, parentSpecification);
		newchoices = JSON.parse(results.possibleChoices);
		index = newchoices.choices.indexOf(specification.toUpperCase());
		if (index > -1) newchoices.choices.splice(index, 1);
		await changeParentChoices(db, parentSpecification, JSON.stringify(newchoices));
		//delete all children
		results = await getAllOrphans(db, specification);
		await deleteAllOrphans(db, results);
		//delete parentReply
		results = await getParentIdHeader(db, parentSpecification);
		await deleteInvalidReply(db, results.idHeader, specification.toUpperCase());
		//delete reply
		await answerDelete(db, specification);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Transaction aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

//UPDATE ANSWER QUICK-REPLY TRANSACTION
async function updateAnswerReply(specification, reply) {
	let results = null;
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		results = await getParent(db, specification);
		results = await getParentIdHeader(db, results.parentSpecification);
		await updateReply(db, results.idHeader, specification.toUpperCase(), reply);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Transaction aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

//UPDATE ANSWER VARIANT TRANSACTION
async function updateAnswerVariants(specification, variantNum, newContent) {
	let results = null;
	let header = null;
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		header = await getAnswerInfo(db, specification);
		results = await getAnswerContents(db, header.idHeader);
		if (results.length < variantNum) await addContentVariant(db, header.idHeader, newContent);
		else await updateContentVariant(db, results[variantNum - 1].idContent, newContent);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Transaction aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

//UPDATE ANSWER DELETE TRANSACTION
async function deleteAnswerVariant(specification, variantNum) {
	let results = null;
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		results = await getAnswerInfo(db, specification);
		results = await getAnswerContents(db, results.idHeader);
		await deleteContentVariant(db, results[variantNum - 1].idContent);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Transaction aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

//GET ALL INFO ABOUT CHATBOT ANSWER
async function getAllAnswerInfo(specification) {
	let db = setupWorkerConn();
	let info = null;
	let contents = null
	let parent = null;
	let qr = null;
	try {
		info = await getAnswerInfo(db, specification);
		contents = await getAnswerContents(db, info.idHeader);
		if (info.parentSpecification === null) parent = await getParentIdHeader(db, "temaVyber");
		else parent = await getParentIdHeader(db, info.parentSpecification)
		if (info.connectedChoices !== null) qr = await getAnswerQuickReply(db, parent.idHeader, (JSON.parse(info.connectedChoices)).lastChoices[0]);
		return { info: info, contents: contents, qr: qr };
	} catch (err) {
		console.log('ERROR: Cannot get answer info. REASON:' + err)
		return null;
	} finally {
		db.close();
	}
}



//--FAQ OPERATIONS--

//GET ALL INFO ABOUT FAQ ANSWER
const getFAQAnswerInfo = async function (intent) {
	let db = setupWorkerConn();
	let faqInfo = null;
	let chatbotInfo = null;
	try {
		faqInfo = await db.getAsync(`SELECT * FROM faq WHERE intent = ?`,
			[intent]);
		if (faqInfo.answerInTree === 1) chatbotInfo = await getAnswerByIntent(db, intent);
		return { faq: faqInfo, chatbot: chatbotInfo };
	} catch (err) {
		console.log('ERROR: Cannot get FAQ info. REASON: ' + err)
		return null;
	} finally {
		db.close();
	}
}

//GET ALL POSSIBLE INTENTS FOR FAQ
const getIntents = async function () {
	let db = setupWorkerConn();
	let results = null;
	try {
		results = await db.allAsync(`SELECT intent FROM faq ORDER BY intent`);
		return results;
	} catch (err) {
		console.log('ERROR: Cannot get FAQ intents. REASON: ' + err)
		return results;
	} finally {
		db.close();
	}
}

const addFAQAnswer = async function (newContent) {
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		await db.runAsync(`INSERT INTO faq (intent, question, textAnswer, urlAnswer, imageAnswer, videoAnswer, answerInTree) VALUES (?,?,?,?,?,?,?)`,
			[newContent.intent, newContent.question,
			newContent.textAnswer, newContent.urlAnswer,
			newContent.imageAnswer, newContent.videoAnswer,
			newContent.answerInTree]);
		if (newContent.answerInTree === 1) await setAnswerIntent(db, newContent.treeSpecification, newContent.intent);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Adding to FAQ aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

const updateFAQAnswer = async function (updatedContent) {
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		await db.runAsync(`UPDATE faq SET question=?, textAnswer=?, urlAnswer=?, imageAnswer=?, videoAnswer=?, answerInTree=? WHERE intent=?`,
			[updatedContent.question, updatedContent.textAnswer,
			updatedContent.urlAnswer, updatedContent.imageAnswer,
			updatedContent.videoAnswer, updatedContent.answerInTree,
			updatedContent.intent]);
		if (updatedContent.answerInTree === 1) {
			await clearAnswerIntent(db, updatedContent.intent);
			await setAnswerIntent(db, updatedContent.treeSpecification, updatedContent.intent);
		} else {
			await clearAnswerIntent(db, updatedContent.intent);
		}
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Updating FAQ aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

const deleteFAQAnswer = async function (intent) {
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		await db.runAsync(`DELETE FROM faq WHERE intent = ?`, [intent]);
		await clearAnswerIntent(db, intent);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Deleting FAQ aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

const getFAQAnswerSelects = async function (intent) {
	let db = setupWorkerConn();
	let selectsContent = { topics: null, contexts: null };
	try {
		selectsContent.topics = await getEditableTopics(db);
		selectsContent.contexts = await getChoosableAnswersFAQ(db, intent);
		return selectsContent;
	} catch (err) {
		console.log('ERROR: Getting FAQ select menus aborted. REASON: ' + err)
		return null;
	} finally {
		db.close();
	}
}

const updateChatbotFieldsChoices = async function (fieldsArray) {
	let db = setupWorkerConn();
	let possibleChoices = { choices: [] };
	let connectedChoices = { lastChoices: [] };
	fieldsArray.forEach(field => {
		possibleChoices.choices.push(field.idField);
		connectedChoices.lastChoices.push(field.idField);
	});
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		await db.runAsync(`UPDATE answerNodes SET possibleChoices=? WHERE specification=?`, [JSON.stringify(possibleChoices), 'oboryVyber']);
		await db.runAsync(`UPDATE answerNodes SET connectedChoices=? WHERE specification=?`, [JSON.stringify(connectedChoices), 'oboryDetaily']);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Updating chatbot fields aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

const updateChatbotTestChoices = async function (testArray) {
	let db = setupWorkerConn();
	let possibleChoicesDownload = { choices: [] };
	let connectedChoicesDownload = { lastChoices: [] };
	let possibleChoices = { choices: [] };
	let connectedChoices = { lastChoices: [] };
	testArray.forEach(test => {
		if (test.canTry === 1) {
			possibleChoices.choices.push(test.collectionName);
			connectedChoices.lastChoices.push(test.collectionName);
		}
		possibleChoicesDownload.choices.push(test.collectionName);
		connectedChoicesDownload.lastChoices.push(test.collectionName);
	});

	try {
		await db.runAsync("BEGIN TRANSACTION;");
		await db.runAsync(`UPDATE answerNodes SET possibleChoices=? WHERE specification=?`, [JSON.stringify(possibleChoices), 'testyVyber']);
		await db.runAsync(`UPDATE answerNodes SET connectedChoices=? WHERE specification=?`, [JSON.stringify(connectedChoices), 'testyInfo']);
		await db.runAsync(`UPDATE answerNodes SET possibleChoices=? WHERE specification=?`, [JSON.stringify(possibleChoicesDownload), 'testyStahnoutVyber']);
		await db.runAsync(`UPDATE answerNodes SET connectedChoices=? WHERE specification=?`, [JSON.stringify(connectedChoicesDownload), 'testyStahnout']);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Updating chatbot tests aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

const addTestQuickReply = async function (test) {
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		await db.runAsync(`INSERT INTO answerQuickReplies (idHeader, text, payload) VALUES (?,?,?)`,
			[17, test.collectionName, test.collectionName]);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Updating test quickReplies aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

const updateTestQuickReply = async function (test, oldTest) {
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		await db.runAsync(`UPDATE answerQuickReplies SET text=?, payload=? WHERE text=? AND idHeader=?`,
			[test.collectionName, test.collectionName, oldTest.collectionName, 17]);
		if (test.canTry && oldTest.canTry) {
			await db.runAsync(`UPDATE answerQuickReplies SET text=?, payload=? WHERE text=? AND idHeader=?`,
				[test.collectionName, test.collectionName, oldTest.collectionName, 23]);
		} else if (test.canTry && !oldTest.canTry) {
			await db.runAsync(`INSERT INTO answerQuickReplies (idHeader, text, payload) VALUES (?,?,?)`,
				[23, test.collectionName, test.collectionName]);
		} else if (!test.canTry && oldTest.canTry) {
			await db.runAsync(`DELETE FROM answerQuickReplies WHERE idHeader=? AND text=?`,
				[23, test.collectionName]);
		}
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Updating test quickReplies aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}

const deleteTestQuickReply = async function (test) {
	let db = setupWorkerConn();
	try {
		await db.runAsync("BEGIN TRANSACTION;");
		await db.runAsync(`DELETE FROM answerQuickReplies WHERE (idHeader=? OR idHeader=?) AND text=?`,
			[17, 23, test.collectionName]);
		await db.runAsync("COMMIT;");
		return true;
	} catch (err) {
		await db.runAsync("ROLLBACK;");
		console.log('ERROR: Deleting test quickReplies aborted. REASON: ' + err)
		return false;
	} finally {
		db.close();
	}
}


module.exports = {
	getFAQAnswerInfo,
	getFAQAnswerSelects,
	getAllAnswerInfo,
	getIntents,

	createChatbotTopic,
	updateChatbotTopic,
	deleteChatbotTopic,

	createChatbotAnswer,
	deleteChatbotAnswer,
	updateAnswerReply,
	updateAnswerVariants,
	deleteAnswerVariant,

	addFAQAnswer,
	updateFAQAnswer,
	deleteFAQAnswer,

	updateChatbotFieldsChoices,
	updateChatbotTestChoices,

	addTestQuickReply,
	updateTestQuickReply,
	deleteTestQuickReply
};


//--ANSWER GETTERS--
function getAnswerInfo(db, specification) {
	return db.getAsync(`SELECT * FROM answerNodes, answerHeaders WHERE specification=? 
		AND answerNodes.specification = answerHeaders.headerSpecification`,
		[specification]);
}

function getAnswerContents(db, idHeader) {
	return db.allAsync(`SELECT * FROM answerContents WHERE idHeader=?`,
		[idHeader]);
}

function getAnswerQuickReply(db, parentIdHeader, payload) {
	return db.getAsync(`SELECT * FROM answerQuickReplies WHERE idHeader=? AND payload=?`,
		[parentIdHeader, payload]);
}

function getParentIdHeader(db, parentSpecification) {
	return db.getAsync(`SELECT idHeader FROM answerHeaders WHERE headerSpecification=?`,
		[parentSpecification]);
}

function getParentChoices(db, parentSpecification) {
	return db.getAsync(`SELECT possibleChoices FROM answerNodes WHERE specification=?`,
		[parentSpecification]);
}

function getParent(db, specification) {
	return db.getAsync(`SELECT parentSpecification FROM answerNodes WHERE specification=?`,
		[specification]);
}

function getAllOrphans(db, specification) {
	return db.allAsync(
		`WITH RECURSIVE
		tclose (spec, parentSpec) AS 
		 (SELECT specification, parentSpecification FROM answerNodes WHERE parentSpecification IS NOT NULL AND parentSpecification = ?
			  UNION ALL
		 SELECT answerNodes.specification, tclose.parentSpec FROM answerNodes, tclose
			  WHERE (answerNodes.parentSpecification = tclose.spec))
		 SELECT spec FROM tclose;`, [specification]);
}

//--CREATE ANSWER--
function createHeader(db, loadedData) {
	return db.runAsync(`INSERT INTO answerHeaders (headerSpecification, returnAllowed, conversationEnding, includesText, includesURL, includesIMG, includesVideo, includesQuickReply) VALUES (?,?,?,?,?,?,?,?)`,
		[loadedData.header.headerSpecification, loadedData.header.returnAllowed, loadedData.header.conversationEnding, loadedData.header.includesText, loadedData.header.includesURL, loadedData.header.includesIMG, loadedData.header.includesVideo, loadedData.header.includesQuickReply]);
}

function createNode(db, loadedData) {
	return db.runAsync(`INSERT INTO answerNodes (idTopic, parentSpecification, connectedChoices, specification) VALUES(?,?,?,?)`,
		[loadedData.topic.idTopic, loadedData.node.parentSpecification, loadedData.node.connectedChoices, loadedData.node.specification]);
}
function createQuickReply(db, loadedData) {
	return db.runAsync(`INSERT INTO answerQuickReplies (idHeader, text, payload) VALUES(?,?,?)`,
		[loadedData.node.parentHeader, loadedData.qr.text, loadedData.qr.payload]);
}

function changeParentChoices(db, parentSpecification, newChoices) {
	return db.runAsync(`UPDATE answerNodes SET possibleChoices=? WHERE specification=?`,
		[newChoices, parentSpecification]);
}

function createContent(db, loadedData) {
	return db.runAsync(`INSERT INTO answerContents (idHeader, text, img, url, video) VALUES(?,?,?,?,?)`,
		[loadedData.header.idHeader, loadedData.content.text, loadedData.content.img, loadedData.content.url, loadedData.content.video]);
}

//--DELETE ANSWER--
function answerDelete(db, specification) {
	return db.runAsync(`DELETE FROM answerNodes WHERE specification = ?`,
		[specification]);
}

function deleteAllOrphans(db, specObject) {
	let specStringArray = [];
	specObject.forEach(element => {
		specStringArray.push(element.spec);
	});
	let sql = 'DELETE FROM answerNodes WHERE specification IN (' + specStringArray.map(function () { return '?' }).join(',') + ')';
	return db.runAsync(sql, specStringArray);
}

function deleteInvalidReply(db, idHeader, payload) {
	return db.runAsync(`DELETE FROM answerQuickReplies WHERE idHeader = ? AND payload = ?`,
		[idHeader, payload]);
}

function deleteContentVariant(db, idContent) {
	return db.runAsync(`DELETE FROM answerContents  WHERE idContent = ?`,
		[idContent]);

}

//--UPDATE ANSWER--
function updateReply(db, idHeader, payload, reply) {
	return db.runAsync(`UPDATE answerQuickReplies SET text=? WHERE idHeader = ? AND payload = ?`,
		[reply, idHeader, payload]);
}

function addContentVariant(db, idHeader, newContent) {
	return db.runAsync(`INSERT INTO answerContents (idHeader, text, img, url, video) VALUES (?,?,?,?,?)`,
		[idHeader, newContent.text, newContent.img, newContent.url, newContent.video]);
}

function updateContentVariant(db, idContent, newContent) {
	return db.runAsync(`UPDATE answerContents SET text=?, url=?, img=?, video=? WHERE idContent = ?`,
		[newContent.text, newContent.url, newContent.img, newContent.video, idContent]);
}

//--TOPIC GETTERS--
function getTopic(db, idTopic) {
	return db.getAsync(`SELECT * FROM topics WHERE idTopic = ?`,
		[idTopic]);
}

function getTopicByName(db, topicName) {
	return db.getAsync(`SELECT * FROM topics WHERE topicName = ?`,
		[topicName]);
}

function getMenuChoices(db) {
	return db.getAsync(`SELECT possibleChoices FROM answerNodes WHERE idTopic=8`);
}

//--CREATE A NEW TOPIC--

function createTopic(db, loadedData) {
	return db.runAsync(`INSERT INTO topics (topicName) VALUES (?)`,
		[loadedData.topic.topicName]);
}

function changeTopicMenu(db, newChoices) {
	return db.runAsync(`UPDATE answerNodes SET possibleChoices=? WHERE idTopic=8`,
		[newChoices]);
}

function createQuickReplyForTopic(db, loadedData) {
	return db.runAsync(`INSERT INTO answerQuickReplies (idHeader, text, payload) VALUES(?,?,?)`,
		[8, loadedData.qr.text, loadedData.qr.payload]);
}

//--DELETE TOPIC--

function deleteTopic(db, idTopic) {
	return db.runAsync(`DELETE FROM topics WHERE idTopic = ?`,
		[idTopic]);
}

function deleteTopicMenuReply(db, payload) {
	return db.runAsync(`DELETE FROM answerQuickReplies WHERE idHeader = 8 AND payload = ?`,
		[payload]);
}

//--UPDATE TOPIC--
function updateTopicName(db, idTopic, topicName) {
	return db.runAsync(`UPDATE topics SET topicName=? WHERE idTopic = ?`,
		[topicName, idTopic]);
}

function updateTopicReply(db, reply, topicName, oldTopicName) {
	return db.runAsync(`UPDATE answerQuickReplies SET text=?, payload=? WHERE idHeader = 8 AND payload=?`,
		[reply, topicName, oldTopicName]);
}

//--CHANGE INTENTS FOR ANSWERS--
function clearAnswerIntent(db, intent) {
	return db.runAsync(`UPDATE answerNodes SET asociatedIntent = ? WHERE answerNodes.asociatedIntent = ?`,
		[null, intent]);
}

function setAnswerIntent(db, specification, intent) {
	return db.runAsync(`UPDATE answerNodes SET asociatedIntent = ? WHERE answerNodes.specification = ?`,
		[intent, specification]);
}

//GET INTENT IN ANSWER
function getAnswerByIntent(db, intent) {
	return db.getAsync(`SELECT topicName, specification FROM answerNodes NATURAL JOIN topics WHERE asociatedIntent=?`,
		[intent]);
}

//GET FAQ AVAILABLE TREE ANSWERS
function getChoosableAnswersFAQ(db, intent) {
	return db.allAsync(`SELECT idTopic, specification FROM answerNodes NATURAL JOIN topics WHERE topics.topicName NOT IN ('MAINMENU', 'BOT', 'FAQ', 'OBORY', 'TESTY') AND (asociatedIntent IS NULL OR asociatedIntent=?)`,
		[intent]);
}

function getEditableTopics(db) {
	return db.allAsync(`SELECT * FROM topics WHERE topicName NOT IN ('MAINMENU', 'BOT', 'FAQ', 'OBORY', 'TESTY')`);
}

