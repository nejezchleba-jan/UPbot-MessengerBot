"use strict";
const sqlite3 = require('./sqlite-async.js');
const pathToDatabase = ('./databases/chatbot_resources.db');

//--WORKER SETUP--
function setupWorkerConn() {
    return new sqlite3.Database(pathToDatabase, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            throw new Error('Invalid database connection.')
        }
    });
}

//ZAMĚSTNANCI
async function getPossiblePositions() {
    let db = setupWorkerConn();
    let results = null;
    try {
        results = await db.allAsync(`SELECT DISTINCT position FROM people`);
        return results;
    } catch (err) {
        console.log('ERROR: Cannot get possible positions. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}


async function getAllPeople() {
    let db = setupWorkerConn();
    let results = null;
    try {
        results = await db.allAsync(`SELECT * FROM people ORDER BY lastName`);
        return results;
    } catch (err) {
        console.log('ERROR: Cannot get people. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}


async function getPersonInfo(idPerson) {
    let db = setupWorkerConn();
    let person = null;
    try {
        person = await db.getAsync(`SELECT * FROM people WHERE idPerson=?`, [idPerson]);
        return person;
    } catch (err) {
        console.log('ERROR: Cannot get person info. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}

async function addPerson(personObject) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`INSERT INTO people (firstName, lastName, titleBefore, titleAfter, position, email, phone, office, profile, teachingPage, picture) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [personObject.firstName, personObject.lastName, personObject.titleBefore, personObject.titleAfter,
            personObject.position, personObject.email, personObject.phone, personObject.office,
            personObject.profile, personObject.teachingPage, personObject.picture]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot get person info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function updatePerson(personObject) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`UPDATE people SET firstName=?, lastName=?, titleBefore=?, titleAfter=?, position=?, email=?, phone=?, office=?, profile=?, teachingPage=?, picture=? WHERE idPerson=?`,
            [personObject.firstName, personObject.lastName, personObject.titleBefore, personObject.titleAfter,
            personObject.position, personObject.email, personObject.phone, personObject.office,
            personObject.profile, personObject.teachingPage, personObject.picture, personObject.idPerson]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot get person info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function deletePerson(idPerson) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`DELETE FROM people WHERE idPerson=?`, [idPerson]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot get person info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

//OBORY

async function getAllFields() {
    let db = setupWorkerConn();
    let results = null;
    try {
        results = await db.allAsync(`SELECT * FROM studyFields ORDER BY fieldName`);
        return results;
    } catch (err) {
        console.log('ERROR: Cannot get fields. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}


async function getFieldInfo(idField) {
    let db = setupWorkerConn();
    let field = null;
    try {
        field = await db.getAsync(`SELECT * FROM studyFields WHERE idField=?`, [idField]);
        return field;
    } catch (err) {
        console.log('ERROR: Cannot get field info. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}

async function addField(fieldobject) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`INSERT INTO studyFields (idField, fieldName, canCombi, fieldType, mainDescription, applicationDescription, studiesDescription, suitableFor, pageURL, icon) VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [fieldobject.idFieldNew, fieldobject.fieldName, fieldobject.canCombi, fieldobject.fieldType, fieldobject.mainDescription,
            fieldobject.applicationDescription, fieldobject.studiesDescription, fieldobject.suitableFor, fieldobject.pageURL,
            fieldobject.icon]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot add the field. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function updateField(fieldobject) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`UPDATE studyFields SET idField=?, fieldName=?, canCombi=?, fieldType=?, mainDescription=?, applicationDescription=?, studiesDescription=?, suitableFor=?, pageURL=?, icon=? WHERE idField=?`,
            [fieldobject.idFieldNew, fieldobject.fieldName, fieldobject.canCombi, fieldobject.fieldType, fieldobject.mainDescription,
            fieldobject.applicationDescription, fieldobject.studiesDescription, fieldobject.suitableFor, fieldobject.pageURL,
            fieldobject.icon, fieldobject.idField]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot update field info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function deleteField(idField) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`DELETE FROM studyFields WHERE idField=?`, [idField]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot delete field info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

//TESTY

async function getAllTests() {
    let db = setupWorkerConn();
    let results = null;
    try {
        results = await db.allAsync(`SELECT * FROM testCollections ORDER BY collectionName`);
        return results;
    } catch (err) {
        console.log('ERROR: Cannot get tests. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}

async function getTestInfo(idCollection) {
    let db = setupWorkerConn();
    let test = null;
    try {
        test = await db.getAsync(`SELECT * FROM testCollections WHERE idCollection=?`, [idCollection]);
        return test;
    } catch (err) {
        console.log('ERROR: Cannot get test info. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}

async function getTestQuestions(idCollection) {
    let db = setupWorkerConn();
    let questions = null;
    try {
        questions = await db.allAsync(`SELECT * FROM testQuestions WHERE idCollection=?`, [idCollection]);
        return questions;
    } catch (err) {
        console.log('ERROR: Cannot get questions. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}

async function addTest(testObject) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`INSERT INTO testCollections (collectionName, collectionInfo, collectionURL, canTry) VALUES (?,?,?,?)`,
            [testObject.collectionName, testObject.collectionInfo, testObject.collectionURL, testObject.canTry]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot add the test. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function updateTest(testObject) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`UPDATE testCollections SET collectionName=?, collectionInfo=?, collectionURL=?, canTry=? WHERE idCollection=?`,
            [testObject.collectionName, testObject.collectionInfo, testObject.collectionURL, testObject.canTry, testObject.idCollection,]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot update test info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function deleteTest(idCollection) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("PRAGMA foreign_keys = ON;");
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`DELETE FROM testCollections WHERE idCollection=?`, [idCollection]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot delete test info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function updateQuestion(questionObject) {
    let db = setupWorkerConn();
    let result = null;
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        result = await db.getAsync(`SELECT * FROM testQuestions WHERE idCollection=? AND questionNumber=?`, [questionObject.idCollection, questionObject.questionNumber]);
        if(result !== undefined) {
            await db.runAsync(`UPDATE testQuestions SET correctAnswer=?, text=?, img=?, answerCount=? WHERE idCollection=? AND questionNumber=?`,
            [questionObject.correctAnswer, questionObject.text, questionObject.img, questionObject.answerCount, questionObject.idCollection, questionObject.questionNumber]);
        } else {
            await db.runAsync(`INSERT INTO testQuestions (idCollection, questionNumber, correctAnswer, text, img, answerCount) VALUES (?,?,?,?,?,?)`,
            [questionObject.idCollection, questionObject.questionNumber, questionObject.correctAnswer, questionObject.text, questionObject.img, questionObject.answerCount]);
        }
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot update question info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function deleteQuestion(idCollection, questionNumber) {
    let db = setupWorkerConn();
    try {
        await db.runAsync("BEGIN TRANSACTION;");
        await db.runAsync(`DELETE FROM testQuestions WHERE idCollection=? AND questionNumber=?`, [idCollection, questionNumber]);
        await db.runAsync(`UPDATE testQuestions SET questionNumber=questionNumber - 1 WHERE idCollection=? AND questionNumber > ?`, [idCollection, questionNumber]);
        await db.runAsync("COMMIT;");
        return true;
    } catch (err) {
        await db.runAsync("ROLLBACK;");
        console.log('ERROR: Cannot delete question info. REASON:' + err)
        return false;
    } finally {
        db.close();
    }
}

async function getQuestion(idCollection, questionNumber) {
    let db = setupWorkerConn();
    try {
        return await db.getAsync(`SELECT * FROM testQuestions WHERE idCollection=? AND questionNumber=?`, [idCollection, questionNumber]);
    } catch (err) {
        console.log('ERROR: Cannot get test question. REASON:' + err)
        return null;
    } finally {
        db.close();
    }
}


module.exports = {
    getPossiblePositions,
    getAllPeople,
    getPersonInfo,
    addPerson,
    updatePerson,
    deletePerson,

    getAllFields,
    getFieldInfo,
    addField,
    updateField,
    deleteField,

    getAllTests,
    getTestInfo,
    getTestQuestions,
    addTest,
    updateTest,
    deleteTest,

    getQuestion,
    updateQuestion,
    deleteQuestion
}