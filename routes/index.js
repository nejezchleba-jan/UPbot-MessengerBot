const express = require('express');
const { check } = require('express-validator');
const queryString = require('querystring');
const router = express.Router();

//--MIDDLEWARE--
const chatbot = require('../chatbot.js');
const errorHandler = require('../middleware/error-handling.js');
const auth = require('../middleware/autentification.js');
const credentials = require('../middleware/edit-credentials.js');
const editTopics = require('../middleware/edit-topics.js');
const editAnswers = require('../middleware/edit-answers.js');
const editFaq = require('../middleware/edit-FAQ.js');
const editResources = require('../middleware/edit-resources.js');
const editUsers = require('../middleware/edit-users.js');
const utils = require('../middleware/utils.js');


//--LOGIN A MENU--
//-----------------------------------------------

router.post('/login', [
	check('password')
		.custom(async (value, { req }) => {
			let result = await auth.checkLoginInfo(req);
			if (!result) throw new Error('Špatné uživatelské jméno nebo heslo.');
		})
], errorHandler.checkForErrors, async function (req, res) {
	await auth.logIn(req);
	res.redirect('/menu')
});

router.get('/', function (req, res) {
	if (req.session && req.session.loggedIn) {
		res.redirect('/menu');
	}
	else {
		res.redirect('/prihlaseni')
	}
});

router.get('/prihlaseni', function (req, res) {
	if (req.session && req.session.loggedIn) {
		res.redirect('/menu');
	}
	else {
		let error = errorHandler.checkForErrorMsg(req);
		res.render('OTHERS/prihlaseni', { errors: error });
	}
});

router.get('/menu', auth.loggedIn, function (req, res) {
	res.render('MENU/main-menu', { restartNeeded: req.app.locals.chatbotRestartNeeded });
});

router.get('/sprava-konverzacniho-stromu', auth.loggedIn, function (req, res) {
	res.render('MENU/sprava-konverzacniho-stromu', { restartNeeded: req.app.locals.chatbotRestartNeeded });
});

router.get('/sprava-FAQ', auth.loggedIn, function (req, res) {
	res.render('MENU/sprava-FAQ', { restartNeeded: req.app.locals.chatbotRestartNeeded });
});

router.get('/sprava-zdrojovych-tabulek', auth.loggedIn, function (req, res) {
	res.render('MENU/sprava-zdrojovych-tabulek', { restartNeeded: req.app.locals.chatbotRestartNeeded });
});

//--OVLADANI--
//-----------------------------------------------

router.get('/ovladani', auth.loggedIn, function (req, res) {
	let state = chatbot.getState();
	res.render('MENU/ovladani', { chatbotState: state, restartNeeded: req.app.locals.chatbotRestartNeeded });
});

router.post('/chatbot-on', auth.loggedIn, async function (req, res) {
	await chatbot.startChatbot();
	req.app.locals.chatbotRestartNeeded = false;
	res.redirect('back');
});

router.post('/chatbot-off', auth.loggedIn, async function (req, res) {
	await chatbot.stopChatbot();
	res.redirect('back');
});

router.post('/chatbot-restart', auth.loggedIn, async function (req, res) {
	await chatbot.restartChatbot();
	req.app.locals.chatbotRestartNeeded = false;
	res.redirect('back');
});


//--UŽIVATEL--
//-----------------------------------------------

router.get('/uzivatelska-nastaveni', auth.loggedIn, function (req, res) {
	res.render('MENU/uzivatelska-nastaveni', { isAdmin: req.session.userAdmin, restartNeeded: req.app.locals.chatbotRestartNeeded, alerts: utils.handleAlerts(req) });
});

/* ZMĚNA ÚDAJŮ */

router.get('/zmena-hesla', auth.loggedIn, function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	res.render('USER-SETTINGS/zmena-hesla', { errors: error });
});

router.post('/change-password', auth.loggedIn, [
	check('oldPass')
		.custom(async (value, { req }) => {
			let result = await credentials.comparePasswords(value, req);
			if (!result) throw new Error('Staré heslo je nesprávné!');
		}),
	check('newPass', 'Délka hesla musí být alespoň 5 znaků!').isLength({ min: 5 }),
	check('newPassAgain').notEmpty().withMessage('Je nutné potvrzení!')
		.custom((value, { req }) => {
			if (value !== req.body.newPass) throw new Error('Potvrzení hesla se neshoduje!');
			return true;
		})
], errorHandler.checkForErrors, async function (req, res) {
	await credentials.changePassword(req);
	req.session.alerts = "Heslo úspěšně změněno.";
	res.redirect('/uzivatelska-nastaveni');
});

router.get('/zmena-uzivatelskeho-jmena', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let username = await credentials.getOldUsername(req);
	res.render('USER-SETTINGS/zmena-uzivatelskeho-jmena', { oldName: username, errors: error });
});

router.get('/odhlasit', auth.loggedIn, auth.logout, function (req, res) {
	res.redirect('/prihlaseni');
});

router.post('/change-username', auth.loggedIn, [
	check('password')
		.custom(async (value, { req }) => {
			let result = await credentials.comparePasswords(value, req);
			if (!result) throw new Error('Heslo je nesprávné!');
		}),
	check('newUsername').notEmpty().withMessage('Nové uživatelské jméno nesmí být prázdné!')
		.custom(async (value, { req }) => {
			let result = await credentials.userAlreadyExists(value);
			if (result) throw new Error('Uživatel s tímto jménem již existuje!');
		}),
], errorHandler.checkForErrors, async function (req, res) {
	await credentials.updateUsername(req);
	req.session.alerts = "Uživatelské jméno úspěšně změněno.";
	res.redirect('/uzivatelska-nastaveni');
});

/* SPRÁVA UŽIVATELŮ */
router.get('/uzivatele', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	let usersList = await editUsers.getAllUsers();
	res.render('USER-SETTINGS/uzivatele', {
		users: usersList,
		errors: error,
		alerts: alert
	});
});

router.post('/users-action', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);

	if (error !== null) {
		res.redirect('back');
		return;
	}

	if (req.body.deleteButton !== undefined) {
		let query = queryString.stringify({
			idUzivatele: req.body.deleteButton
		});
		res.redirect('/uzivatele-odebrat' + '?' + query);
		return;
	}
});

router.get('/uzivatele-pridat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (!req.session.userAdmin) {
		res.redirect('/404');
		return;
	}

	res.render('USER-SETTINGS/uzivatele-pridat', {
		errors: error
	});
});

router.post('/user-add', auth.loggedIn, [
	check('password', 'Výchozí heslo nesmí být prázdné').notEmpty(),
	check('password', 'Délka hesla musí být alespoň 5 znaků!').isLength({ min: 5 }),
	check('username')
		.notEmpty()
		.withMessage('Uživatelské jméno nesmí být prázdné!')
		.custom(async (value, { req }) => {
			let result = await credentials.userAlreadyExists(value);
			if (result) throw new Error('Uživatel s tímto jménem již existuje!');
		}),
], errorHandler.checkForErrors, async function (req, res) {
	let success = await editUsers.createUser(req);
	if (!success) {
		req.session.errors = [{ msg: "Nepodařilo se vytvořit uživatele." }];
		res.redirect('back');
	} else {
		req.session.alerts = "Uživatel úspěšně vytvořen.";
		res.redirect('/uzivatele');
	}
});

router.get('/uzivatele-odebrat', auth.loggedIn, async function (req, res) {
	if (!req.session.userAdmin) {
		res.redirect('/404');
		return;
	}
	let error = errorHandler.checkForErrorMsg(req);
	let foundUser = await editUsers.getUser(req.query.idUzivatele);
	res.render('USER-SETTINGS/uzivatele-odebrat', {
		user: foundUser, errors: error, alerts: utils.handleAlerts(req)
	});
});

router.post('/user-delete', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	let success = await editUsers.deleteUser(queryObject.idUzivatele);
	if (!success) {
		req.session.errors = [{ msg: "Nepodařilo se vymazat uživatele." }];
		res.redirect('back');
	} else {
		req.session.alerts = "Uživatel úspěšně vymazán.";
		res.redirect('/uzivatele');
	}
});

//--FAQ--
//-----------------------------------------------
router.get('/FAQ', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	let intentsList = await editFaq.getAllIntents();
	res.render('FAQ/FAQ', {
		intents: intentsList,
		errors: error,
		alerts: alert
	});
});

router.post('/FAQ-action', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (error !== null) {
		res.redirect('back');
		return;
	}

	if (req.body.deleteButton !== undefined) {
		let query = queryString.stringify({
			vybranaOtazka: req.body.deleteButton
		});
		res.redirect('/FAQ-odebrat' + '?' + query);
		return;
	}

	if (req.body.updateButton !== undefined) {
		let query = queryString.stringify({
			vybranaOtazka: req.body.updateButton
		});
		res.redirect('/FAQ-upravit' + '?' + query);
		return;
	}

	if (req.body.trainButton !== undefined) {
		let query = queryString.stringify({
			vybranaOtazka: req.body.trainButton
		});
		res.redirect('/FAQ-trenovat' + '?' + query);
		return;
	}
});

/* PŘIDAT */
router.get('/FAQ-pridat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let selectContents = await editFaq.getSelectableTreeAnswers(null);
	res.render('FAQ/FAQ-pridat', {
		topics: selectContents.topics, contexts: selectContents.contexts,
		errors: error
	});
});

router.post('/add-FAQ', auth.loggedIn, [
	check('intent', 'Prázdná zkratka otázky!').notEmpty(),
	check('question', 'Prázdný text u položené otázky!').notEmpty(),
	check('answerType', 'Vyberte typ odpovědi!').custom((value, { req }) => {
		if (!req.body.answerInTree) {
			let possibelVals = ["Text", "TextURL", "Obrázek", "Video"];
			return possibelVals.includes(value);
		}
		return true;
	}),
	check(['textAnswer', 'urlAnswer', 'imageAnswer', 'videoAnswer']).custom((value, { req }) => {
		if (editFaq.checkFAQValues(req)) return true;
	}),
	check('answerInTree', 'Neplatný výběr existující odpovědi!').if(check('answerInTree').exists()).custom((value, { req }) => {
		if (req.body.topicSelect !== undefined && req.body.contextSelect !== undefined) return true;
	}),
], errorHandler.checkForErrors, async function (req, res) {
	let success = await editFaq.addFAQ(req);
	if (!success) {
		req.session.errors = [{ msg: "Nepodařilo se přidat novou otázku." }];
		res.redirect('back');
	} else {
		req.session.alerts = "Otázka úspěšně přidána do FAQ.";
		res.redirect('/FAQ');
	}
});

/* ODEBRAT */
router.get('/FAQ-odebrat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let loadedContent = await editFaq.getFAQInfo(req.query.vybranaOtazka);
	if (Object.keys(req.query).length === 0) {
		res.render('OTHERS/404');
	} else {
		res.render('FAQ/FAQ-odebrat', {
			chatbot: loadedContent.chatbot,
			faq: loadedContent.faq,
			errors: error,
		});
	}
});

router.post('/delete-FAQ', auth.loggedIn, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	let success = await editFaq.deleteFAQ(queryObject.vybranaOtazka);
	if (!success) {
		req.session.errors = [{ msg: "Nepodařilo se odstranit otázku." }];
		res.redirect('back');
	} else {
		req.session.alerts = "Otázka úspěšně odebrána z FAQ.";
		res.redirect('/FAQ');
	}
});

/* UPRAVIT */
router.get('/FAQ-upravit', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let selectContents = await editFaq.getSelectableTreeAnswers(req.query.vybranaOtazka);
	let loadedContent = await editFaq.getFAQInfo(req.query.vybranaOtazka);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		res.render('FAQ/FAQ-upravit', {
			chatbot: loadedContent.chatbot, faq: loadedContent.faq,
			topics: selectContents.topics, contexts: selectContents.contexts,
			errors: error
		});
	}
});

router.post('/update-FAQ', auth.loggedIn, [
	check('question', 'Otázka nesmí být prádzná!').notEmpty(),
	check('answerType', 'Vyberte typ odpovědi!').custom((value, { req }) => {
		if (!req.body.answerInTree) {
			let possibleVals = ["Text", "TextURL", "Obrázek", "Video"];
			return possibleVals.includes(value);
		}
		return true;
	}),
	check(['textAnswer', 'urlAnswer', 'imageAnswer', 'videoAnswer']).custom((value, { req }) => {
		if (editFaq.checkFAQValues(req)) return true;
	}),
	check('answerInTree', 'Neplatný výběr existující odpovědi!').if(check('answerInTree').exists()).custom((value, { req }) => {
		if (req.body.topicSelect !== undefined && req.body.contextSelect !== undefined) return true;
	})
], errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['intent'] = queryObject.vybranaOtazka;
	let success = await editFaq.updateFAQ(req);
	if (!success) {
		req.session.errors = [{ msg: "Nepodařilo se aktualizovat otázku." }];
		res.redirect('back');
	} else {
		req.session.alerts = "Otázka z FAQ úspěšně aktualizována.";
		res.redirect('/FAQ');
	}
});

//--TRÉNOVÁNÍ--
//---------------------------------------------------

router.get('/FAQ-trenovat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		res.render('FAQ/FAQ-trenovat', {
			loadedContent: await editFaq.getFAQInfo(req.query.vybranaOtazka),
			errors: error, alerts: alert
		});
	}
});

router.post('/add-sample', auth.loggedIn, [
	check('newSample', 'Možná verze otázky nesmí být prázdná!').notEmpty(),
], errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['intent'] = queryObject.vybranaOtazka;
	let success = await editFaq.addSample(req);
	if (!success) {
		req.session.errors = [{ msg: "Nepodařilo se přidat další verzi otázky." }];
		res.redirect('back');
	} else {
		req.session.alerts = "Nový vzor otázky úspěšně přidán.";
		res.redirect('/FAQ');
	}
});


//--ODPOVĚDI--
//---------------------------------------------
router.get('/odpovedi', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	let coreAnswersList = await editAnswers.getCoreAnswers();
	let userAnswersList = await editAnswers.getUserAnswers();
	res.render('ANSWERS/odpovedi', {
		coreTopics: coreAnswersList.topicsArray,
		coreContexts: coreAnswersList.contextsArray,
		userTopics: userAnswersList.topicsArray,
		userContexts: userAnswersList.contextsArray,
		errors: error,
		alerts: alert
	});
});

router.post('/answers-action', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);

	if (error !== null) {
		res.redirect('back');
		return;
	}

	if (req.body.deleteButton !== undefined) {
		let query = queryString.stringify({
			kontext: req.body.deleteButton
		});
		res.redirect('/odpoved-odebrat' + '?' + query);
		return;
	}

	if (req.body.updateButton !== undefined) {
		let query = queryString.stringify({
			kontext: req.body.updateButton
		});
		res.redirect('/odpoved-upravit' + '?' + query);
		return;
	}
});

router.post('/answer-choose', auth.loggedIn, [
	check(["topicSelect", "contextSelect"], "Vyberte z možností.").exists()
], errorHandler.checkForErrors, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (error !== null) {
		res.redirect('back');
		return;
	}
	let query = queryString.stringify({ tema: req.body.topicSelect, kontext: req.body.contextSelect });
	let ref = req.get('Referrer');
	if (ref.lastIndexOf('?') !== -1) ref = ref.substring(0, ref.lastIndexOf('?'));
	res.redirect(ref + '?' + query);
});

/* PŘIDAT */
router.get('/odpoved-pridat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let selectContents = await editAnswers.getAnswerAddSelects();
	if (Object.keys(req.query).length === 0) {
		res.render('ANSWERS/odpoved-pridat', {
			topics: selectContents.topicsArray, contexts: selectContents.contextsArray,
			errors: error
		});
	} else {
		let childrenStatus = await editAnswers.getDirectChildren(req.query.kontext);
		res.render('ANSWERS/odpoved-pridat', {
			topicName: req.query.tema, parentContext: req.query.kontext, childrenStatus: childrenStatus,
			topics: selectContents.topicsArray, contexts: selectContents.contextsArray,
			errors: error
		});
	}
});

router.post('/answer-add', auth.loggedIn, [
	check('answerContext', 'Prázdný název nového kontextu!').notEmpty(),
	check('answerReply', 'Prázdné znění rychlé odpovědi!').notEmpty(),
	check('answerType', 'Vyberte typ odpovědi!').isIn(['Text', 'TextURL', 'Obrázek', 'Video']),
	check(['textAnswer', 'urlAnswer', 'imageAnswer', 'videoAnswer'])
		.custom((value, { req }) => { if (editAnswers.checkContentValues(req)) return true; }),
], errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['answerTopic'] = queryObject.tema;
	req.body['answerParentContext'] = queryObject.kontext;
	let children = await editAnswers.getDirectChildren(queryObject.kontext);
	if (children.length === 10) {
		req.session.errors = [{ msg: "Rodičovský kontext již má maximální počet potomků!" }];
		res.redirect('back');
		return;
	}
	let success = await editAnswers.createAnswer(req);
	if (!success) {
		req.session.errors = [{ msg: "Odpověď se nepodařilo uložit do databáze!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Nová odpověď úspěšně přidána.";
		res.redirect('/odpovedi');
	}
});

/* UPRAVIT */
router.get('/odpoved-upravit', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		let loadedData = await editAnswers.getAnswerInfo(req.query.kontext);
		let variantsCount = loadedData.contents.length;
		loadedData.contents = loadedData.contents[req.query.varianta - 1];
		res.render('ANSWERS/odpoved-upravit', {
			loaded: loadedData,
			variantsCount: variantsCount,
			errors: error, alerts: utils.handleAlerts(req)
		});
	}
});

router.post('/answer-update', auth.loggedIn, [
	check('reply', 'Prázdné znění rychlé odpovědi!').notEmpty(),
], errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['answerContext'] = queryObject.kontext;
	let success = await editAnswers.updateAnswerReply(req);
	if (!success) {
		req.session.errors = [{ msg: "Změnu rychlé odpovědi se nepodařilo uložit do databáze!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Rychlá odpověď úspěšně aktualizována.";
		res.redirect('back');
	}
});

/* EDITOVAT VARIANTY */
router.post('/change-variant', auth.loggedIn, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['variantContext'] = queryObject.kontext;
	req.body['variantTopic'] = queryObject.tema;
	let determineAction = (req.body.changeVariantButton !== undefined ? false : true);
	if (determineAction) {
		let variants = await editAnswers.getVariants(req);
		let length = variants.length + 1;
		let query = queryString.stringify({
			tema: req.body.variantTopic,
			kontext: req.body.variantContext, varianta: length
		});
		res.redirect('/odpoved-upravit-varianty?' + query);
	} else {
		let query = queryString.stringify({
			tema: req.body.variantTopic,
			kontext: req.body.variantContext,
			varianta: req.body.variant
		});
		res.redirect('/odpoved-upravit-varianty?' + query);
	}
});

router.get('/odpoved-upravit-varianty', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let variant = await editAnswers.getChosenVariant(req);
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	let query = queryString.stringify({ tema: queryObject.tema, kontext: queryObject.kontext });
	let ref = "/odpoved-upravit?" + query;
	res.render('ANSWERS/odpoved-upravit-varianty', {
		topicName: req.query.tema, context: req.query.kontext, variant: variant,
		errors: error, referer: ref, alerts: utils.handleAlerts(req)
	});
});

router.post('/variant-update', auth.loggedIn, [
	check(['textAnswer', 'urlAnswer', 'imageAnswer', 'videoAnswer'], "Prázdný obsah odpovědi!")
		.custom((value, { req }) => { if (editAnswers.checkVariantValidity(req)) return true; })
], errorHandler.checkForErrors, async function (req, res) {
	let success = false;
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['variantContext'] = queryObject.kontext;
	req.body['variantNum'] = queryObject.varianta;
	if (req.body.variantUpdateButton !== undefined) {
		success = await editAnswers.updateAnswerVariant(req);
		if (!success) {
			req.session.errors = [{ msg: "Aktualizaci varianty odpovědi se nepodařilo uložit do databáze!" }];
			res.redirect('back');
		} else {
			req.app.locals.chatbotRestartNeeded = true;
			req.session.alerts = "Varianty úspěšně aktualizovány.";
			res.redirect(req.body.variantUpdateButton);
		}
	} else if (req.body.variantDeleteButton !== undefined) {
		success = await editAnswers.deleteAnswerVariant(req);
		if (!success) {
			req.session.errors = [{ msg: "Variantu odpovědi se nepodařilo vymazat z databáze!" }];
			res.redirect('back');
		} else {
			req.app.locals.chatbotRestartNeeded = true;
			req.session.alerts = "Varianta úspěšně vymazána.";
			res.redirect(req.body.variantDeleteButton);
		}
	} else {
		let returnVal = req.body.returnButton.includes('/odpoved-upravit');
		(returnVal ? res.redirect(req.body.returnButton) : res.redirect('back'));
	}
});

/* ODEBRAT */
router.get('/odpoved-odebrat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		let loadedData = await editAnswers.getAnswerInfo(req.query.kontext);
		let childrenStatus = await editAnswers.getDirectChildren(req.query.kontext);
		loadedData.contents = loadedData.contents[0];
		res.render('ANSWERS/odpoved-odebrat', {
			selectedContext: req.query.kontext,
			loaded: loadedData,
			childrenStatus: childrenStatus,
			errors: error
		});
	}
});

router.post('/answer-delete', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['answerContext'] = queryObject.kontext;
	let success = await editAnswers.deleteAnswer(req);
	if (!success) {
		req.session.errors = [{ msg: "Odpověď se nepodařilo odebrat z databáze!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Odpověď a její potomci úspěšně vymazáni.";
		res.redirect('/odpovedi');
	}
});



//--TEMA--
//---------------------------------------------
router.get('/temata', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	let topicsList = await editTopics.getTopicsForSelection();
	res.render('TOPICS/temata', {
		topics: topicsList,
		errors: error,
		alerts: alert
	});
});


router.post('/topics-action', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);

	if (error !== null) {
		res.redirect('back');
		return;
	}

	if (req.body.deleteButton !== undefined) {
		let query = queryString.stringify({
			idTema: req.body.deleteButton
		});
		res.redirect('/tema-odebrat' + '?' + query);
		return;
	}

	if (req.body.updateButton !== undefined) {
		let query = queryString.stringify({
			idTema: req.body.updateButton
		});
		res.redirect('/tema-upravit' + '?' + query);
		return;
	}
});

/* PŘIDAT */
router.get('/tema-pridat', auth.loggedIn, function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	res.render('TOPICS/tema-pridat', { errors: error });
});

router.post('/topic-add', auth.loggedIn, [
	check('newTopic', 'Prázdný název tématu!').notEmpty(),
	check('newRootContext', 'Prázdný název kontextu!').notEmpty(),
	check('newReply', 'Prázdné znění rychlé odpovědi!').notEmpty(),
	check('answerType', 'Vyberte typ odpovědi!').isIn(['Text', 'TextURL', 'Obrázek', 'Video']),
	check(['textAnswer', 'urlAnswer', 'imageAnswer', 'videoAnswer']).custom((value, { req }) => { if (editAnswers.checkContentValues(req)) return true; })
], errorHandler.checkForErrors, async function (req, res) {
	let success = await editTopics.createNewTopic(req);
	if (!success) {
		req.session.errors = [{ msg: "Téma se nepodařilo uložit do databáze!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Téma úspěšně vytvořeno.";
		res.redirect('/temata');
	}
});


/* ODEBRAT */
router.get('/tema-odebrat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		let foundRoot = await editTopics.getRootForSelected(req.query.idTema);
		let topic = await editTopics.getTopic(req.query.idTema);
		let foundQuickReply = await editTopics.getTopicReply(topic.topicName);
		res.render('TOPICS/tema-odebrat', {
			topic: topic, rootAnswer: foundRoot, quickReply: foundQuickReply,
			errors: error
		});
	}
});

router.post('/topic-delete', auth.loggedIn, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	let success = await editTopics.deleteTopic(queryObject.idTema);
	if (!success) {
		req.session.errors = [{ msg: "Téma se nepodařilo odebrat z databáze!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Téma úspěšně vymazáno.";
		res.redirect('/temata');
	}
});


/* UPRAVIT */
router.get('/tema-upravit', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let topicsSelect = await editTopics.getTopicsForSelection();
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		let topic = await editTopics.getTopic(req.query.idTema);
		let foundQuickReply = await editTopics.getTopicReply(topic.topicName);
		res.render('TOPICS/tema-upravit', {
			topic: topic, quickReply: foundQuickReply, topicsSelect: topicsSelect,
			errors: error
		});
	}
});

router.post('/topic-update', auth.loggedIn, [
	check('nameTopic', 'Název tématu nesmí být prázdný!').notEmpty(),
	check('reply', 'Název rychlé odpovědi nesmí být prázdný!').notEmpty()
], errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['idTopic'] = queryObject.idTema;
	let success = await editTopics.updateTopic(req);
	if (!success) {
		req.session.errors = [{ msg: "Téma se nepodařilo aktualizovat v databázi!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Téma úspěšně aktualizováno.";
		res.redirect('/temata');
	}
});

//ZDROJOVÉ TABULKY

//ZAMĚSTNANCI
//---------------------------------------------
router.get('/zamestnanci', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	let personSelect = await editResources.getPersonSelect();
	res.render('RESOURCE-TABLES/zamestnanci', {
		people: personSelect,
		errors: error,
		alerts: alert
	});
});

router.post('/person-action', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);

	if (error !== null) {
		res.redirect('back');
		return;
	}

	if (req.body.deleteButton !== undefined) {
		let query = queryString.stringify({
			idOsoba: req.body.deleteButton
		});
		res.redirect('/zamestnanci-odebrat' + '?' + query);
		return;
	}

	if (req.body.updateButton !== undefined) {
		let query = queryString.stringify({
			idOsoba: req.body.updateButton
		});
		res.redirect('/zamestnanci-upravit' + '?' + query);
		return;
	}
});

/* PŘIDAT */
router.get('/zamestnanci-pridat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	res.render('RESOURCE-TABLES/zamestnanci-pridat', {
		positions: await editResources.getPositionSelect(),
		errors: error
	});
});

router.post('/person-add', auth.loggedIn, [
	check('firstName', 'Prázdné jméno!').notEmpty(),
	check('lastName', 'Prázdné příjmení!').notEmpty(),
	check('position', 'Prázdná pozice!').exists(),
	check('email', 'Neplatný email!').if(check('email').notEmpty()).isEmail(),
	check('profilePic', 'Neplatný odkaz na obrázek!').if(check('profilePic').notEmpty()).isURL(),
	check('web', 'Neplatná webová stránka!').if(check('web').notEmpty()).isURL(),
	check('personalWeb', 'Neplatná webová stránka!').if(check('personalWeb').notEmpty()).isURL(),
], errorHandler.checkForErrors, async function (req, res) {
	let success = await editResources.createPerson(req);
	if (!success) {
		req.session.errors = [{ msg: "Osobu se nepodařilo uložit do databáze!" }];
		res.redirect('back');
	} else {
		req.session.alerts = "Osoba úspěšně uložena.";
		res.redirect('/zamestnanci');
	}
});

/* UPRAVIT */
router.get('/zamestnanci-upravit', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let positionsSelect = await editResources.getPositionSelect();
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		res.render('RESOURCE-TABLES/zamestnanci-upravit', {
			personInfo: await editResources.getPersonInfo(parseInt(req.query.idOsoba)),
			positions: positionsSelect,
			errors: error
		});
	}
});

router.post('/person-edit', auth.loggedIn, [
	check('firstName', 'Prázdné jméno!').notEmpty(),
	check('lastName', 'Prázdné příjmení!').notEmpty(),
	check('position', 'Prázdná pozice!').exists(),
	check('email', 'Neplatný email!').if(check('email').notEmpty()).isEmail(),
	check('picture', 'Neplatný odkaz na obrázek!').if(check('picture').notEmpty()).isURL(),
	check('profile', 'Neplatná webová stránka!').if(check('profile').notEmpty()).isURL(),
	check('teachingPage', 'Neplatná webová stránka!').if(check('teachingPage').notEmpty()).isURL(),
], errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body.person = queryObject.idOsoba;
	let success = await editResources.updatePerson(req);
	if (!success) {
		req.session.errors = [{ msg: "Osobu se nepodařilo aktualizovat!" }];
		res.redirect('back');
	} else {
		req.session.alerts = "Osoba úspěšně aktualizována!";
		res.redirect('/zamestnanci');
	}
});

/* ODEBRAT */
router.get('/zamestnanci-odebrat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let positionsSelect = await editResources.getPositionSelect();
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		res.render('RESOURCE-TABLES/zamestnanci-odebrat', {
			personInfo: await editResources.getPersonInfo(parseInt(req.query.idOsoba)),
			positions: positionsSelect,
			errors: error
		});
	}
});

router.post('/person-delete', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	let success = await editResources.deletePerson(queryObject.idOsoba);
	if (!success) {
		req.session.errors = [{ msg: "Osobu se nepodařilo odebrat!" }];
		res.redirect('back');
	} else {
		req.session.alerts = "Osoba úspěšně odebrána!";
		res.redirect('/zamestnanci');
	}
});

//OBORY
//---------------------------------------------
router.get('/obory', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	let fieldSelect = await editResources.getFieldSelect();
	res.render('RESOURCE-TABLES/obory', {
		fields: fieldSelect,
		errors: error,
		alerts: alert
	});
});

router.post('/fields-action', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);

	if (error !== null) {
		res.redirect('back');
		return;
	}

	if (req.body.deleteButton !== undefined) {
		let query = queryString.stringify({
			idObor: req.body.deleteButton
		});
		res.redirect('/obory-odebrat' + '?' + query);
		return;
	}

	if (req.body.updateButton !== undefined) {
		let query = queryString.stringify({
			idObor: req.body.updateButton
		});
		res.redirect('/obory-upravit' + '?' + query);
		return;
	}
});

/* PŘIDAT */
router.get('/obory-pridat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	res.render('RESOURCE-TABLES/obory-pridat', { errors: error });
});

router.post('/field-add', auth.loggedIn, [
	check('field', 'Prázdná zkratka oboru!').notEmpty(),
	check('fieldName', 'Prázdný název oboru!').notEmpty(),
	check('fieldType', 'Prázdné studium!').exists(),
	check('pageURL', 'Neplatná stránka s oboru!').notEmpty().isURL(),
	check('icon', 'Neplatný odkaz na obrázek!').if(check('icon').notEmpty()).isURL(),
	check('mainDescription', 'Prázdný popis oboru!').notEmpty(),
	check('applicationDescription', 'Prázdný popis uplatnění!').notEmpty(),
	check('studiesDescription', 'Prázdný popis studijního programu!').notEmpty(),
	check('suitableFor', 'Prázdná kolonka "Vhodné pro"!').notEmpty(),
], errorHandler.checkForErrors, async function (req, res) {
	let success = await editResources.createField(req);
	if (!success) {
		req.session.errors = [{ msg: "Obor se nepodařilo uložit do databáze!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Obor úspěšně uložen.";
		res.redirect('/obory');
	}
});

/* UPRAVIT */
router.get('/obory-upravit', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		res.render('RESOURCE-TABLES/obory-upravit', {
			fieldInfo: await editResources.getFieldInfo(req.query.idObor),
			errors: error
		});
	}
});

router.post('/field-edit', auth.loggedIn, [
	check('field', 'Prázdná zkratka oboru!').notEmpty(),
	check('fieldName', 'Prázdný název oboru!').notEmpty(),
	check('fieldType', 'Prázdné studium!').exists(),
	check('pageURL', 'Neplatná stránka s oboru!').notEmpty().isURL(),
	check('icon', 'Neplatný odkaz na obrázek!').if(check('icon').notEmpty()).isURL(),
	check('mainDescription', 'Prázdný popis oboru!').notEmpty(),
	check('applicationDescription', 'Prázdný popis uplatnění!').notEmpty(),
	check('studiesDescription', 'Prázdný popis studijního programu!').notEmpty(),
	check('suitableFor', 'Prázdná kolonka "Vhodné pro"!').notEmpty(),
], errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['idField'] = queryObject.idObor;
	let success = await editResources.updateField(req);
	if (!success) {
		req.session.errors = [{ msg: "Obor se nepodařilo aktualizovat!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Obor úspěšně aktualizován.";
		res.redirect('/obory');
	}
});

/* ODEBRAT */
router.get('/obory-odebrat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		res.render('RESOURCE-TABLES/obory-odebrat', {
			fieldInfo: await editResources.getFieldInfo(req.query.idObor),
			errors: error
		});
	}
});

router.post('/field-delete', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	let success = await editResources.deleteField(queryObject.idObor);
	if (!success) {
		req.session.errors = [{ msg: "Obor se nepodařilo odebrat!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Obor úspěšně odebrán!";
		res.redirect('/obory');
	}
});

//TESTY
//---------------------------------------------
router.get('/testy', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	let testSelect = await editResources.getTestSelect();
	res.render('RESOURCE-TABLES/testy', {
		tests: testSelect,
		errors: error,
		alerts: alert
	});
});

router.post('/tests-action', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);

	if (error !== null) {
		res.redirect('back');
		return;
	}

	if (req.body.deleteButton !== undefined) {
		let query = queryString.stringify({
			idTest: req.body.deleteButton
		});
		res.redirect('/testy-odebrat' + '?' + query);
		return;
	}

	if (req.body.updateButton !== undefined) {
		let query = queryString.stringify({
			idTest: req.body.updateButton
		});
		res.redirect('/testy-upravit' + '?' + query);
		return;
	}
});

/* PŘIDAT */

router.get('/testy-pridat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	res.render('RESOURCE-TABLES/testy-pridat', { errors: error, alerts: utils.handleAlerts(req) });
});


router.post('/test-add', auth.loggedIn, [
	check('collectionName', 'Prázdný název testu!').notEmpty(),
	check('collectionURL', 'Neplatný odkaz na test!').isURL(),
], errorHandler.checkForErrors, async function (req, res) {
	let success = await editResources.createTest(req);
	if (!success) {
		req.session.errors = [{ msg: "Test se nepodařilo uložit do databáze!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Test úspěšně uložen.";
		res.redirect('/testy');
	}
});

/* ODEBRAT */

router.get('/testy-odebrat', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		res.render('RESOURCE-TABLES/testy-odebrat', {
			testInfo: await editResources.getTestInfo(parseInt(req.query.idTest)),
			errors: error
		});
	}
});

router.post('/test-delete', auth.loggedIn, errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	let success = await editResources.deleteTest(queryObject.idTest);
	if (!success) {
		req.session.errors = [{ msg: "Test se nepodařilo odebrat!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Test úspěšně odebrán!";
		res.redirect('/testy');
	}
});

/* UPRAVIT */

router.get('/testy-upravit', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let alert = utils.handleAlerts(req);
	if (Object.keys(req.query).length === 0) {
		res.redirect('/404');
		return;
	} else {
		res.render('RESOURCE-TABLES/testy-upravit', {
			testInfo: await editResources.getTestInfo(parseInt(req.query.idTest)),
			errors: error,
			alerts: alert
		});
	}
});

router.post('/test-edit', auth.loggedIn, [
	check('collectionName', 'Prázdný název testu!').notEmpty(),
	check('collectionURL', 'Neplatný odkaz na test!').isURL(),
	check('canTry')
	.if(check('canTry').exists())
		.custom(async (value, { req }) => {
			let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
			let testInfo = await editResources.getTestInfo(queryObject.idTest);
			if (testInfo.questions.length > 0) return true;	
			else throw Error('Test pro vyzkoušení musí obsahovat alespoň jednu otázku!');
		})
], errorHandler.checkForErrors, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['idCollection'] = queryObject.idTest;
	let success = await editResources.updateTest(req);
	if (!success) {
		req.session.errors = [{ msg: "Test se nepodařilo aktualizovat!" }];
		res.redirect('back');
	} else {
		req.app.locals.chatbotRestartNeeded = true;
		req.session.alerts = "Test úspěšně aktualizován!";
		res.redirect('back');
	}
});

/* TESTOVÉ OTÁZKY EDITACE */

router.post('/question-choose', auth.loggedIn, async function (req, res) {
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	let questionNumber = req.body.questionsSelect;
	let wantAdd = req.body.addQuestionBtn;
	let testInfo = await editResources.getTestInfo(queryObject.idTest);
	if (questionNumber === undefined) {
		questionNumber = 1;
	}
	if (wantAdd !== undefined) {
		questionNumber = testInfo.questions.length + 1;
	}

	let query = queryString.stringify({ idTest: queryObject.idTest, cisloOtazky: questionNumber });
	res.redirect('/testy-otazky-editace' + '?' + query);
});


router.get('/testy-otazky-editace', auth.loggedIn, async function (req, res) {
	let error = errorHandler.checkForErrorMsg(req);
	let query = queryString.stringify({ idTest: req.query.idTest });
	let question = await editResources.getQuestion(req.query.idTest, req.query.cisloOtazky);
	res.render('RESOURCE-TABLES/testy-otazky-editace', {
		questionNumber: req.query.cisloOtazky,
		question: question,
		referer: '/testy-upravit' + '?' + query,
		errors: error
	});
});

router.post('/question-edit', auth.loggedIn, [
	check('questionType', 'Neplatný typ zadání otázky!').isIn(['img', 'text']),
	check('text', 'Prázdné textové zadání!').if(check('questionType').equals('text')).notEmpty(),
	check('img', 'Prázdná odkaz obrázku zadání!').if(check('questionType').equals('img')).notEmpty(),
	check('answerCount', 'Neplatné množství odpovědí!').isInt({ min: 1, max: 7 }),
	check('correctAnswer', 'Neplatná správná odpověď!').exists().isIn(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
		.custom((value, { req }) => {
			let possibleAnswers = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
			possibleAnswers.splice(req.body.answerCount);
			if (possibleAnswers.includes(value)) return true;
		}),
], errorHandler.checkForErrors, async function (req, res) {
	let success = false;
	let queryObject = utils.getQueryFromRequestURL(req.headers.referer);
	req.body['idCollection'] = queryObject.idTest;
	req.body['questionNumber'] = queryObject.cisloOtazky;
	if (req.body.questionUpdateBtn !== undefined) {
		success = await editResources.updateTestQuestions(req);
		if (!success) {
			req.session.errors = [{ msg: "Otázku se nepodařilo aktualizovat!" }];
			res.redirect('back');
		} else {
			req.app.locals.chatbotRestartNeeded = true;
			req.session.alerts = "Otázky úspěšně aktualizovány.";
			res.redirect(req.body.questionUpdateBtn);
		}
	} else if (req.body.questionDeleteBtn !== undefined) {
		success = await editResources.deleteTestQuestion(queryObject.idTest, queryObject.cisloOtazky);
		if (!success) {
			req.session.errors = [{ msg: "Otázku se nepodařilo odebrat" }];
			res.redirect('back');
		} else {
			req.app.locals.chatbotRestartNeeded = true;
			req.session.alerts = "Otázka úspěšně odebrána.";
			res.redirect(req.body.questionDeleteBtn);
		}
	}
});

module.exports = router;