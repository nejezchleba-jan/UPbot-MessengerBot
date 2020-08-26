"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index.js');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet')

require('dotenv').config()

var app = express();

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

//Nastavené session middlewaru
app.use(session({
	store: new SQLiteStore({dir: './databases', db: 'web_database.db', concurrentDB: true}),
	secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false , key: 'sessionCookieId',
	cookie: { path: '/', httpOnly: true, secure: false, maxAge: 7 * 3600000 } //secure: true na HTTPS serveru
}));

app.use('/', routes);

app.set('trust proxy', 1);
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.locals.chatbotRestartNeeded = false;

app.listen(process.env.WEB_PORT || 8080, () => {
	console.log('START_LOG: WEB is listening on PORT: ' + process.env.WEB_PORT);
});

//WEB ERRORY
app.use(function(req, res) {
	res.status(400).render('OTHERS/404');
});
   
app.use(function(error, req, res, next) {
	console.log(error);
	res.status(500).render('OTHERS/500');
});



