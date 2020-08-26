const chatbotDB = require('../bot_modules/database_modules/chatbot-DB.js');
const chatbotUpdater = require('../database_util_modules/chatbot-db-updater.js');
const editFaq = require('./edit-FAQ.js');

const getTopicsForSelection = async function () {
    return await chatbotDB.getEditableTopics();
}

const getRootForSelected = async function (selectedTopicId) {
    return await chatbotDB.getRootForTopic(selectedTopicId);
}

const getTopic = async function (selectedTopicId) {
    return await chatbotDB.getTopic(selectedTopicId);
}

const getTopicReply = async function (topicName) {
    return await chatbotDB.getTopicQuickReply(8, topicName);
}

const createNewTopic = async function (req) {
    let loadedData = parseNewTopic(req);
    return await chatbotUpdater.createChatbotTopic(loadedData);
}


const updateTopic = async function (req) {
    let formatedName = req.body.nameTopic.toUpperCase().replace(/\s+/g, "_")
    return await chatbotUpdater.updateChatbotTopic(req.body.idTopic, formatedName, req.body.reply);
}

const deleteTopic = async function (idTopic) {
    let intentsArray = await chatbotDB.getIntentsbyTopic(idTopic);
    let faqUpdated = true;
    if (intentsArray.length > 0) {
        for(let i = 0; i < intentsArray.length; i++) {
            faqUpdated = await editFaq.deleteFAQ(intentsArray[i].asociatedIntent);
            if (!faqUpdated) return false;
        }
    }
    if (faqUpdated) return await chatbotUpdater.deleteChatbotTopic(idTopic); 
}


module.exports = {
    getTopicsForSelection,
    getRootForSelected,
    getTopic,
    getTopicReply,
    createNewTopic,
    updateTopic,
    deleteTopic
}

function parseNewTopic(req) {
    let type = getAnswerType(req);
    let content = getContent(type, req);
    let loadedData = {
        topic: { topicName: req.body.newTopic.toUpperCase().replace(/\s+/g, "_") },
        header: {
            headerSpecification: req.body.newRootContext.replace(/\s+/g, "_"),
            includesText: type.includesText,
            includesURL: type.includesURL,
            includesIMG: type.includesIMG,
            includesVideo: type.includesVideo,
            conversationEnding: 1,
            returnAllowed: 0,
            includesQuickReply: 1
        },
        node: {
            parentSpecification: null,
            connectedChoices: JSON.stringify({ lastChoices: [req.body.newTopic.toUpperCase().replace(/\s+/g, "_")] }),
            specification: req.body.newRootContext.replace(/\s+/g, "_")
        },
        qr: {
            text: req.body.newReply,
            payload: req.body.newTopic.toUpperCase().replace(/\s+/g, "_")
        },
        content: {
            text: content.text,
            img: content.img,
            url: content.url,
            video: content.video,
        }
    }
    return loadedData;
}

function getAnswerType(req) {
    let type = {
        includesText: 0,
        includesURL: 0,
        includesIMG: 0,
        includesVideo: 0
    }
    if (req.body.answerType === "Text") type.includesText = 1;
    if (req.body.answerType === "TextURL") {
        type.includesText = 1;
        type.includesURL = 1;
    }
    if (req.body.answerType === "Obrázek") type.includesIMG = 1;
    if (req.body.answerType === "Video") type.includesVideo = 1;
    return type;
}

function getContent(type, req) {
    let content = {
        text: null,
        img: null,
        url: null,
        video: null
    }
    if (type.includesText) content.text = req.body.textAnswer;;
    if (type.includesURL) content.url = req.body.urlAnswer;
    if (type.includesIMG) content.img = req.body.imageAnswer;
    if (type.includesVideo) content.video = req.body.videoAnswer;
    return content;
}





