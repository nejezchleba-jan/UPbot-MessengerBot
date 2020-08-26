function getQueryFromRequestURL(url) {
	return decodeURI(url)
		.split('?')[1]
		.replace('?', '')
		.split('&')
		.map(param => param.split('='))
		.reduce((values, [key, value]) => {
			values[key] = value
			return values
		}, {});
}

function handleAlerts(req) {
	let alert = req.session.alerts;
	req.session.alerts = null;
	return alert;
}

module.exports = {
    getQueryFromRequestURL,
    handleAlerts
}