const chatbotDB = require('../bot_modules/database_modules/chatbot-DB.js');
const chatbotUpdater = require('../database_util_modules/chatbot-db-updater.js');
const editFaq = require('./edit-FAQ.js');


const getCoreAnswers = async function () {
    let loadedData = { topicsArray: null, contextsArray: null };
    loadedData.topicsArray = await chatbotDB.getCoreTopics();
    loadedData.contextsArray = await chatbotDB.getContextsForCoreTopics();
    return loadedData;
}

const getUserAnswers = async function () {
    let loadedData = { topicsArray: null, contextsArray: null };
    loadedData.topicsArray = await chatbotDB.getUserTopics();
    loadedData.contextsArray = await chatbotDB.getContextsForUserTopics();
    return loadedData;
}

const getAnswerAddSelects = async function () {
    let loadedData = { topicsArray: null, contextsArray: null };
    loadedData.topicsArray = await chatbotDB.getUserTopics();
    loadedData.contextsArray = await chatbotDB.getAvailableParentSpec();
    return loadedData;
}

const getVariants = async function (req) {
    let header = await chatbotDB.getHeaderBySpecification(req.body.variantContext);
    return await chatbotDB.getContentVariants(header.idHeader);
}

const getChosenVariant = async function (req) {
    let header = await chatbotDB.getHeaderBySpecification(req.query.kontext)
    let variants = await chatbotDB.getContentVariants(header.idHeader);
    return (variants.length < req.query.varianta
        ? { variantNew: true, variantNum: req.query.varianta, content: { text: "", url: "", img: "", video: "" }, header: header }
        : { variantNew: false, variantNum: req.query.varianta, content: variants[req.query.varianta - 1], header: header });

}

const getDirectChildren = async function (context) {
    return await chatbotDB.getContextDirectChildren(context)
}

const updateAnswerReply = async function (req) {
    return await chatbotUpdater.updateAnswerReply(req.body.answerContext, req.body.reply);
}

const updateAnswerVariant = async function (req) {
    let newContent = {
        text: (req.body.textAnswer === "" ? null : req.body.textAnswer),
        url: (req.body.urlAnswer === "" ? null : req.body.urlAnswer ),
        img: (req.body.imageAnswer === "" ? null : req.body.imageAnswer ),
        video: (req.body.videoAnswer === "" ? null : req.body.videoAnswer )
    }
    return await chatbotUpdater.updateAnswerVariants(req.body.variantContext, req.body.variantNum, newContent);
}

const deleteAnswerVariant = async function (req) {
    return await chatbotUpdater.deleteAnswerVariant(req.body.variantContext, req.body.variantNum);
}

const createAnswer = async function (req) {
    let loadedData = parseNewAnswer(req);
    return await chatbotUpdater.createChatbotAnswer(loadedData);
}

const getAnswerInfo = async function (specification) {
    return await chatbotUpdater.getAllAnswerInfo(specification)
}

const deleteAnswer = async function (req) {
    let answerInfo = await chatbotUpdater.getAllAnswerInfo(req.body.answerContext);
    let faqUpdated = true;
    if(answerInfo.info.asociatedIntent !== null) {
        faqUpdated = await editFaq.deleteFAQ(answerInfo.info.asociatedIntent);
    }
    if(faqUpdated) return await chatbotUpdater.deleteChatbotAnswer(req.body.answerContext);
    else return false;
}

const checkContentValues = function (req) {
    let type = getAnswerType(req);
    if (type.includesText) {
        if (req.body.textAnswer === "") throw new Error('Prázdné pole pro text u textové odpovědi!');
    }
    if (type.includesURL) {
        if (req.body.textAnswer === "") throw new Error('Prázdné pole pro text u textové odpovědi s odkazem!');
        if (req.body.urlAnswer === "") throw new Error('Prázdné pole pro odkaz u odpovědi s odkazem!');
    }
    if (type.includesIMG) {
        if (req.body.imageAnswer === "") throw new Error('Prázdné pole pro obrázek u obrázkové odpovědi!');
    }
    if (type.includesVideo) {
        if (req.body.videoAnswer === "") throw new Error('Prázdné pole pro video u video odpovědi!');
    }
    return true;
}

const checkVariantValidity = function (req) {
    if (req.body.textAnswer != undefined && req.body.textAnswer === '') return false;
    if (req.body.textAnswer != undefined && req.body.textAnswer === '' 
        && req.body.urlAnswer != undefined && req.body.urlAnswer === '') return false;
    if (req.body.imageAnswer != undefined && req.body.imageAnswer === '') return false;
    if (req.body.videoAnswer != undefined && req.body.videoAnswer === '') return false;
    return true
}

module.exports = {
    createAnswer,
    deleteAnswer,
    updateAnswerReply,
    
    getAnswerAddSelects,
    getAnswerInfo,
    getDirectChildren,

    getVariants,
    getChosenVariant,
    updateAnswerVariant,
    deleteAnswerVariant,
    checkContentValues,
    checkVariantValidity,

    getCoreAnswers,
    getUserAnswers
}

function parseNewAnswer(req) {
    let type = getAnswerType(req);
    let content = getContent(type, req);
    let loadedData = {
        topic: {
            topicName: req.body.answerTopic.replace(/\s+/g,"_"),
            idTopic: null
        },
        header: {
            headerSpecification: req.body.answerContext.replace(/\s+/g,"_"),
            includesText: type.includesText,
            includesURL: type.includesURL,
            includesIMG: type.includesIMG,
            includesVideo: type.includesVideo,
            conversationEnding: 0,
            returnAllowed: 1,
            includesQuickReply: 1
        },
        node: {
            parentSpecification: req.body.answerParentContext.replace(/\s+/g,"_"),
            connectedChoices: JSON.stringify({ lastChoices: [req.body.answerContext.toUpperCase().replace(/\s+/g,"_")] }),
            specification: req.body.answerContext.replace(/\s+/g,"_")
        },
        qr: {
            text: req.body.answerReply,
            payload: req.body.answerContext.toUpperCase().replace(/\s+/g,"_")
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
    if (type.includesText) content.text = req.body.textAnswer;
    if (type.includesURL) content.url = req.body.urlAnswer;
    if (type.includesIMG) content.img = req.body.imageAnswer;
    if (type.includesVideo) content.video = req.body.videoAnswer;
    return content;
}