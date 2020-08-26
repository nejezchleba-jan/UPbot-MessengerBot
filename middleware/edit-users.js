const bcrypt = require('bcrypt');
const webDB = require('../models/users.js');

const getUser = async function (idUser) {
    return await webDB.findUserById(idUser);
}

const getAllUsers = async function () {
    return await webDB.getAllUsernames();
}

const createUser = async function (req) {
    let user = {
        username: req.body.username, 
        password: await bcrypt.hash(req.body.password, 12),
        isAdmin: 0
    };
    let result = await webDB.createUser(user);
    if(result !== null) return true;
    return false;
}

const deleteUser = async function (idUser) {
    let result = await webDB.deleteUser(idUser);
    if(result !== null) return true;
    return false;
}

module.exports = {
    getUser,
    getAllUsers,
    createUser,
    deleteUser
}