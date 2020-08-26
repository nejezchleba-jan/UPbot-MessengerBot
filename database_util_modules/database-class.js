"use strict";

const sqlite3 = require('./sqlite-async.js');

class Database {
	constructor(dbFilePath) {
		this.dbFile = dbFilePath;
		console.log('START_LOG: Using database ' + dbFilePath);
	}

	establishConnection(){
		return new sqlite3.Database(this.dbFile, sqlite3.OPEN_READWRITE, (err) => {
			if (err) {
				console.log('START_LOG: Could not connect to database at ' + dbFilePath + '\n' + err);
				return err;
			}
		});
	}

	async run(sql, params = []) {
		let results = null;
		let db = this.establishConnection();
		try{
			results = await db.runAsync(sql, params);
		} catch(err) {
			console.log(err);
		} finally {
			db.close();
			return results;
		}
	}

	async get(sql, params = []) {
		let results = null;
		let db = this.establishConnection();
		try{
			results = await db.getAsync(sql, params);
		} catch(err) {
			console.log(err);
		} finally {
			db.close();
			return results;
		}
	}

	async all(sql, params = []) {
		let results = null;
		let db = this.establishConnection();
		try{
			results = await db.allAsync(sql, params);
		} catch(err) {
			console.log(err);
		} finally {
			db.close();
			return results;
		}
	}
}

module.exports = Database;

