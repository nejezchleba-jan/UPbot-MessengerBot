const chatbotUpdater = require('../database_util_modules/chatbot-db-updater.js');
const witAI = require('./wit-ai.js');

const getAllIntents = async function() {
    return await chatbotUpdater.getIntents();
}

const getFAQInfo = async function(selectedIntent) {
    return await chatbotUpdater.getFAQAnswerInfo(selectedIntent);
}

const getSelectableTreeAnswers = async function(intent) {
    return await chatbotUpdater.getFAQAnswerSelects(intent);
}

const addFAQ = async function(req) { 
    let newContent = parseData(req);
    let dbUpdated = await chatbotUpdater.addFAQAnswer(newContent);
    if(dbUpdated) return await witAI.addNewValueToEntity(newContent);
    else return false;
}

const addSample = async function(req) {
    let newSample = {question: req.body.newSample, intent: req.body.intent};
    return await witAI.addNewValueToEntity(newSample); 
}

const updateFAQ = async function(req) {
    let updatedContent = parseData(req);
    let oldContent = await chatbotUpdater.getFAQAnswerInfo(updatedContent.intent);
    let witUpdated = false;
    if(oldContent.faq.question !== updatedContent.question) {
        witUpdated = await witAI.deleteSample(oldContent.faq.question);
        if (!witUpdated) return false;
    }

    if(witUpdated) {
        witUpdated = await witAI.addNewValueToEntity(updatedContent);  
        if (!witUpdated) return false;
    }
        
    let dbUpdated = await chatbotUpdater.updateFAQAnswer(updatedContent);
    return dbUpdated;
}

const deleteFAQ = async function(choosenIntent) {
    let witUpdated = await witAI.deleteValueFromEntity(choosenIntent);
    let dbUpdated = false;
    if(witUpdated) {
        dbUpdated = await chatbotUpdater.deleteFAQAnswer(choosenIntent);
        return dbUpdated;
    }
    return false;
}

const checkFAQValues = function (req) {
    let type = getAnswerType(req);
    if(req.body.answerInTree !== undefined) return true;
    if (type.includesText) {
        if(req.body.textAnswer === "") throw new Error('Prázdné pole pro text u textové odpovědi!');
    } 
    if (type.includesURL) {
        if(req.body.textAnswer === "") throw new Error('Prázdné pole pro text u textové odpovědi s odkazem!');
        if(req.body.urlAnswer === "") throw new Error('Prázdné pole pro odkaz u odpovědi s odkazem!');
    } 
    if (type.includesIMG) {
        if(req.body.imageAnswer === "") throw new Error('Prázdné pole pro obrázek u obrázkové odpovědi!');
    }
    if (type.includesVideo) {
        if(req.body.videoAnswer === "") throw new Error('Prázdné pole pro video u video odpovědi!');
    }
    return true;
}



module.exports = {
    getAllIntents,
    getFAQInfo,
    getSelectableTreeAnswers,
    addFAQ,
    updateFAQ,
    deleteFAQ,
    addSample,
    checkFAQValues
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

function parseData(req) {
    return {
        intent: req.body.intent.toLowerCase().replace(/\s+/g,"_"),
        question: req.body.question,
        answerInTree: (req.body.answerInTree === undefined ? 0 : 1),
        treeSpecification: (req.body.answerInTree === undefined ? null : req.body.contextSelect),
        textAnswer: (req.body.textAnswer === "" || req.body.answerType !== "Text" ? null : req.body.textAnswer),
        urlAnswer: (req.body.urlAnswer === "" || req.body.answerType !== "TextURL" ? null : req.body.urlAnswer),
        imageAnswer: (req.body.imageAnswer === "" || req.body.answerType !== "Image" ? null : req.body.imageAnswer),
        videoAnswer: (req.body.videoAnswer === "" || req.body.answerType !== "Video" ? null : req.body.videoAnswer)
    }
}