const bcrypt = require('bcrypt');
const webDB = require('../models/users.js');

const updateUsername = async function (req) {
    let newUsername = req.body.newUsername;
    await webDB.updateUsername(req.session.userId, newUsername);
};

const getOldUsername = async function (req) {
    let user = await webDB.findUserById(req.session.userId);
    return user.username;

};
const changePassword = async function (req) {
    let hash = await bcrypt.hash(req.body.newPass, 12);
    await webDB.updateUserPassword(req.session.userId, hash);
};

const comparePasswords = async function (value, req) {
    let password = value;
    let user = await webDB.findUserById(req.session.userId);
    let result = await bcrypt.compare(password, user.password);
    return result;
}

const userAlreadyExists = async function (username) {
    let user = await webDB.findUserByUsername(username);
    if(user !== undefined) return true;
    return false;
}

module.exports = {
    userAlreadyExists,
    updateUsername,
    getOldUsername,
    changePassword,
    comparePasswords
}