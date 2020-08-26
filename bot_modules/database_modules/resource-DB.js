"use strict";

const DBClass = require('../../database_util_modules/database-class.js');
const pathToDatabase = ('./databases/chatbot_resources.db');
const database = new DBClass(pathToDatabase);

class ResourceDBClass {
	constructor(database) {
		this.database = database;
	}

	//DOTAZY PRO TABULKU S LIDMI
	getPersonById(idPerson) {
		return this.database.get(
			`SELECT * FROM people WHERE idPerson = ?`,
			[idPerson]);
	}

	getPeopleByPosition(positionsArray) {
		let sql = 'SELECT * FROM people WHERE position IN (' + positionsArray.map(function () { return '?' }).join(',') + ')';
		return this.database.all(sql, positionsArray);
	}

	getTeachers() {
		return this.database.all(
			`SELECT * FROM people WHERE teacher = 1`);
	}


	//DOTAZY PRO TABULKU S OBORY
	getFieldById(idField) {
		return this.database.get(
			`SELECT * FROM studyFields WHERE idField = ?`,
			[idField]);
	}

	getFieldsByType(fieldType) {
		return this.database.all(
			`SELECT * FROM studyFields WHERE fieldType = ?`,
			[fieldType]);
	}

	//DOTAZY PRO TABULKU S PŘIJÍMACÍMI TESTY
	getTestQuestion(questionNumber, collectionName) {
		return this.database.get(
			`SELECT * FROM testQuestions NATURAL JOIN testCollections WHERE questionNumber = ? AND collectionName = ?`,
			[questionNumber, collectionName]);
	}

	getCollectionInfo(collectionName) {
		return this.database.get(
			`SELECT collectionInfo FROM testCollections WHERE collectionName = ?`,
			[collectionName]);
	}

	getCollectionURL(collectionName) {
		return this.database.get(
			`SELECT collectionURL FROM testCollections WHERE collectionName = ?`,
			[collectionName]);
	}

	getTestQuestionCount(collectionName) {
		return this.database.get(
			`SELECT count(*) as questionCount FROM testQuestions NATURAL JOIN testCollections WHERE collectionName = ?`,
			[collectionName]);
	}

	//DOTAZY PRO FAQ
	getFAQ(intent) {
		return this.database.get(
			`SELECT * FROM faq WHERE intent = ?`,
			[intent]);
	}
}

const ResourceDB = new ResourceDBClass(database);

module.exports = ResourceDB;