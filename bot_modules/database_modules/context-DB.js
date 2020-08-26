"use strict";

const DBClass = require('../../database_util_modules/database-class.js');
const pathToDatabase = ('./databases/user_context.db');
const database = new DBClass(pathToDatabase);


class ContextDBClass {
  constructor(database) {
    this.database = database;
  }

  //KONTEXT
  getUserContext(PSID) {
    return this.database.get(
      `SELECT * FROM usersContext WHERE idUser = ?`,
      [PSID]);
  }

  updateUserContext(PSID, topic, context, lastMessage, answeringQuestion, chosenField, chosenStudy, lastTimestamp) {
    return this.database.run(
      `UPDATE usersContext SET currentTopic = ?, currentContext = ?, lastMessage = ?, answeringQuestion = ?, chosenField = ?, chosenStudy = ?, lastTimestamp = ? WHERE idUser = ?`,
      [topic, context, lastMessage, answeringQuestion, chosenField, chosenStudy, lastTimestamp, PSID]);
  }

  setAnsweringQuestion(PSID, value) {
    return this.database.run(
      `UPDATE usersContext SET answeringQuestion = ? WHERE idUser = ?`,
      [value, PSID]);
  }

  createUserContext(PSID, currentTopic, currentContext, lastMessage, answeringQuestion, lastTimestamp) {
    return this.database.run(
      `INSERT INTO usersContext (idUser, currentTopic, currentContext, lastMessage, answeringQuestion, lastTimestamp) VALUES (?,?,?,?,?,?)`,
      [PSID, currentTopic, currentContext, lastMessage, answeringQuestion, lastTimestamp]);
  }

  createUserTestsContext(PSID) {
    return this.database.run(
      `INSERT INTO usersTests (idUser) VALUES (?)`,
      [PSID]);
  }


  //TESTY
  getTestContext(PSID) {
    return this.database.get(
      `SELECT * FROM usersTests WHERE idUser = ?`,
      [PSID]);
  }

  getCurrentQuestion(PSID) {
    return this.database.get(
      `SELECT currentQuestion FROM usersTests WHERE idUser = ?`,
      [PSID]);
  }

  setCurrentQuestion(PSID, questionNumber) {
    return this.database.run(
      `UPDATE usersTests SET currentQuestion = ? WHERE idUser = ?`,
      [questionNumber, PSID]);
  }

  getTestType(PSID) {
    return this.database.get(
      `SELECT testType FROM usersTests WHERE idUser = ?`,
      [PSID]);
  }

  setTestType(PSID, testType) {
    return this.database.run(
      `UPDATE usersTests SET testCollection = ? WHERE idUser = ?`,
      [testType, PSID]);
  }

  getQuestionCount(PSID) {
    return this.database.get(
      `SELECT takingTest FROM usersTests WHERE idUser = ?`,
      [PSID]);
  }

  setQuestionCount(PSID, questionCount) {
    return this.database.get(
      `UPDATE usersTests SET questionCount= ? WHERE idUser = ?`,
      [questionCount, PSID]);
  }

}

const ContextDB = new ContextDBClass(database);

module.exports = ContextDB;