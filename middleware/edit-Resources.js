const resourceUpdater = require('../database_util_modules/resource-db-updater');
const chatbotUpdater = require('../database_util_modules/chatbot-db-updater');

//ZAMĚSTNANCI
async function getPersonSelect() {
    let people = await resourceUpdater.getAllPeople();
    people.forEach(person => {
        person['fullName'] = createFullName(person);
    });
    return people;
}

async function getPositionSelect() {
    return await resourceUpdater.getPossiblePositions();
}

async function getPersonInfo(idPerson) {
    return await resourceUpdater.getPersonInfo(idPerson);
}

async function createPerson(req) {
    let person = parsePersonData(req);
    return await resourceUpdater.addPerson(person);
}

async function updatePerson(req) {
    let person = parsePersonData(req);
    return await resourceUpdater.updatePerson(person);
}

async function deletePerson(idPerson) {
    return await resourceUpdater.deletePerson(idPerson);
}

//OBORY
async function getFieldSelect() {
    return await resourceUpdater.getAllFields();
}

async function getFieldInfo(idField) {
    return await resourceUpdater.getFieldInfo(idField);
}

async function createField(req) {
    let field = parseFieldData(req);
    let success = await resourceUpdater.addField(field);
    let fieldsArray = [];
    if(success) {
        fieldsArray = await resourceUpdater.getAllFields();
        return await chatbotUpdater.updateChatbotFieldsChoices(fieldsArray);
    } 
    return false;
}

async function updateField(req) {
    let field = parseFieldData(req);
    let success = await resourceUpdater.updateField(field);
    let fieldsArray = [];
    if(success) {
        fieldsArray = await resourceUpdater.getAllFields();
        return await chatbotUpdater.updateChatbotFieldsChoices(fieldsArray);
    } 
    return false;
}

async function deleteField(idField) {
    let success = await resourceUpdater.deleteField(idField);
    let fieldsArray = [];
    if(success) {
        fieldsArray = await resourceUpdater.getAllFields();
        return await chatbotUpdater.updateChatbotFieldsChoices(fieldsArray);
    } 
    return false
}

//TESTY
async function getTestSelect() {
    return await resourceUpdater.getAllTests();
}

async function getTestInfo(idCollection) {
    let test = {info: null, questions: null};
    test.info = await resourceUpdater.getTestInfo(idCollection);
    test.questions = await resourceUpdater.getTestQuestions(idCollection);
    return test;
}

async function createTest(req) {
    let test = parseTestData(req);
    let resourceUpdated = await resourceUpdater.addTest(test);
    let quickReplyUpdated = false;
    let testsArray = null;
    if(resourceUpdated) {
        quickReplyUpdated = await chatbotUpdater.addTestQuickReply(test);
        if(quickReplyUpdated) {
            testsArray = await resourceUpdater.getAllTests();
            return await chatbotUpdater.updateChatbotTestChoices(testsArray);
        }
    } 
    return false;
}

async function updateTest(req) {
    let test = parseTestData(req);
    let oldTest = await resourceUpdater.getTestInfo(test.idCollection);
    let resourceUpdated = await resourceUpdater.updateTest(test);
    let testsArray = null;
    if(resourceUpdated) {
        quickReplyUpdated = await chatbotUpdater.updateTestQuickReply(test, oldTest);
        if(quickReplyUpdated) {
            testsArray = await resourceUpdater.getAllTests();
            return await chatbotUpdater.updateChatbotTestChoices(testsArray);
        }
    }
    return false;
}

async function deleteTest(idCollection) {
    let test = await resourceUpdater.getTestInfo(idCollection);
    let success = await resourceUpdater.deleteTest(idCollection);
    let testsArray = null;
    if(success) {
        await chatbotUpdater.deleteTestQuickReply(test);
        testsArray = await resourceUpdater.getAllTests();
        return await chatbotUpdater.updateChatbotTestChoices(testsArray);
    } 
    return false;
}

async function getQuestion(idCollection, questionNumber) {
    return await resourceUpdater.getQuestion(idCollection, questionNumber);
}

async function updateTestQuestions(req) {
    let question = parseQuestionData(req);
    return await resourceUpdater.updateQuestion(question);
}

async function deleteTestQuestion(idCollection, questionNumber) {
    return await resourceUpdater.deleteQuestion(idCollection, questionNumber);
}


module.exports = {
    getPersonSelect,
    getPositionSelect,
    getPersonInfo,
    createPerson,
    updatePerson,
    deletePerson,

    getFieldSelect,
    getFieldInfo,
    createField,
    updateField,
    deleteField,

    getTestSelect,
    getTestInfo,
    createTest,
    updateTest,
    deleteTest,

    getQuestion,
    updateTestQuestions,
    deleteTestQuestion

}

function parseQuestionData(req) {
    let question = {
        idCollection: req.body.idCollection,
        questionNumber: req.body.questionNumber,
        text: (req.body.text !== undefined  ? req.body.text : null),
        img: (req.body.img !== undefined  ? req.body.img : null),
        answerCount: req.body.answerCount,
        correctAnswer: req.body.correctAnswer,
    }
    return question;
}


function parseTestData(req) {
    let test = {
        idCollection: req.body.idCollection,
        collectionName: req.body.collectionName.toUpperCase(), 
        collectionURL: req.body.collectionURL,
        canTry: (req.body.canTry === undefined ? 0 : 1),
        collectionInfo: (req.body.collectionInfo === '' ? null : req.body.collectionInfo), 
    }
    return test;
}

function parseFieldData(req) {
    let field = {
        idField: req.body.idField,
        idFieldNew: req.body.field.toUpperCase(),
        fieldName: req.body.fieldName, 
        fieldType: req.body.fieldType,
        canCombi: (req.body.canCombi === undefined ? 0 : 1), 
        mainDescription: req.body.mainDescription, 
        applicationDescription: req.body.applicationDescription, 
        studiesDescription: req.body.studiesDescription, 
        suitableFor: req.body.suitableFor, 
        pageURL: req.body.pageURL, 
        icon: (req.body.icon === '' ? null : req.body.icon)
    }
    return field;
}


function parsePersonData(req) {
    let person = {
        idPerson: (req.body.person === undefined ? null : req.body.person), 
        firstName: req.body.firstName, 
        lastName: req.body.lastName, 
        titleBefore: (req.body.titleBefore === '' ? null : req.body.titleBefore), 
        titleAfter: (req.body.titleAfter === '' ? null : req.body.titleAfter),  
        position: (req.body.position === '' ? null : req.body.position),
        email: (req.body.email === '' ? null : req.body.email),
        phone: (req.body.phone === '' ? null : req.body.phone),
        office: (req.body.office === '' ? null : req.body.office),
        profile: (req.body.profile === '' ? null : req.body.profile), 
        teachingPage: (req.body.teachingPage === '' ? null : req.body.teachingPage),
        picture: (req.body.picture === '' ? null : req.body.picture)
    }
    return person;
}

function createFullName(person) {
    let fullName = "";
    if(person.titleBefore != null) fullName += person.titleBefore + ' ';
    fullName += person.firstName + ' ' + person.lastName;
    if(person.titleAfter != null) fullName += person.titleAfter;
    return fullName;
}
