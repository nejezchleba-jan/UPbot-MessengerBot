const bcrypt = require('bcrypt');
const webDB = require('../models/users.js');


const logIn = async function (req) {
  let user = await webDB.findUserByUsername(req.body.username);
  req.session.loggedIn = true;
  req.session.userAdmin = user.isAdmin;
  req.session.userId = user.id;
  req.session.errors = null;
  req.session.alerts = null;
}

const checkLoginInfo = async function (req) {
  let username = req.body.username;
  let password = req.body.password;
  let user = await webDB.findUserByUsername(username);
  if (!user) return false;
  let result = await bcrypt.compare(password, user.password);
  if (!result) return false;
  return true;
}

const loggedIn = function (req, res, next) {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/prihlaseni'); 
  }
}

const logout = function (req, res, next) {
  if (req.session && req.session.loggedIn) {
    req.session.destroy(function (err) {
      if (err) return res.status(500).send("Server error během odhlašování!");
    })
  }
  next();
}

module.exports = {
  logIn,
  checkLoginInfo,
  loggedIn,
  logout
}