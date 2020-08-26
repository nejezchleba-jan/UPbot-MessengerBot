const { validationResult } = require('express-validator');

const checkForErrors = function(req, res, next){
	let errors = validationResult(req);
	if (!errors.isEmpty()) {
		req.session.errors = errors.array();
		res.redirect('back');
	} else {
        next();
    }	
}

const checkForErrorMsg = function(req) {
	let error = null;
	if (req.session.errors !== undefined && req.session.errors !== null) {
		error = req.session.errors[0].msg;
		req.session.errors = null;
	}
	return error;
}

module.exports = {
    checkForErrors,
    checkForErrorMsg
}