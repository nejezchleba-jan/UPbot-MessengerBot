const sqlite3Async = require('sqlite3').verbose();

sqlite3Async.Database.prototype.runAsync = function (sql, params = []) {
	return new Promise((resolve, reject) => {
		this.run(sql, params, function (err) {
			if (err) {
				console.log('Error running SQL query: ' + sql);
				reject(err);
			}
			resolve(this);
		});
	});
};

sqlite3Async.Database.prototype.getAsync = function (sql, params = []) {
	return new Promise((resolve, reject) => {
		this.get(sql, params, function (err, result) {
			if (err) {
				console.log('Error running SQL query: ' + sql);
				reject(err);		
			}
			resolve(result);
		});
	});
}

sqlite3Async.Database.prototype.allAsync = function (sql, params = []) {
	return new Promise((resolve, reject) => {
		this.all(sql, params, (err, rows) => {
			if (err) {
				console.log('Error running SQL query: ' + sql);
				reject(err);
			}
			resolve(rows);
		});
	});
}

module.exports = sqlite3Async;