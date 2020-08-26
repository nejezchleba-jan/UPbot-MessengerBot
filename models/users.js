"use strict";

const DBClass = require('../database_util_modules/database-class.js');
const pathToDatabase = ('./databases/web_database.db');
const database = new DBClass(pathToDatabase);

class WebDBClass {
    constructor(database) {
        this.database = database;
    }

    getAllUsernames() {
        return database.all(`SELECT id, username FROM users WHERE isAdmin=0`);
    }

    findUserByUsername(username) {
        return database.get(`SELECT * FROM users WHERE username = ?`,
            [username]);
    };

    updateUserPassword(userId, newPassword) {
        return database.get(`UPDATE users SET password = ? WHERE id = ?`,
            [newPassword, userId]);
    };

    updateUsername(idUser, newUsername) {
        return database.get(`UPDATE users SET username = ? WHERE id = ?`,
            [newUsername, idUser]);
    };

    findUserById(idUser) {
        return database.get(`SELECT * FROM users WHERE id = ?`,
            [idUser]);
    };

    createUser(user) {
        return database.run('INSERT INTO users (username, password, isAdmin) VALUES (?,?,?)',
            [user.username, user.password, user.isAdmin]);
    };

    deleteUser(idUser) {
        return database.run('DELETE FROM users WHERE id = ?', [idUser]);
    };
}

const WebDB = new WebDBClass(database);

module.exports = WebDB;