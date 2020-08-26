const fetch = require('node-fetch');

async function addNewValueToEntity(receivedContent) {
    let connection = {
        url: new URL("https://api.wit.ai/samples"),
        headers: {
            "Authorization": "Bearer " + process.env.WIT_SERVER_TOKEN,
            "Content-Type": 'application/json'
        },
    };

    let requestBody = [{
        text: receivedContent.question,
        entities: [
            {
                entity: "FAQ",
                value: receivedContent.intent
            }]
    }];

    try {
        await fetch(connection.url, {
            method: 'POST',
            headers: connection.headers,
            body: JSON.stringify(requestBody)
        });
        return true;
    } catch (err) {
        console.error("ERROR WHILE USING WIT API: " + err);
        return false;
    }
}

async function deleteValueFromEntity(receivedIntent) {
    let connection = {
        url: new URL("https://api.wit.ai/traits/FAQ/values/" + encodeURI(receivedIntent)),
        headers: {
            "Authorization": "Bearer " + process.env.WIT_SERVER_TOKEN,
        },
    };

    try {
        await fetch(connection.url, {
            method: 'DELETE',
            headers: connection.headers,
        });
        return true;
    } catch (err) {
        console.error("ERROR WHILE USING WIT API: " + err);
        return false;
    }
}

async function deleteSample(question) {
    let connection = {
        url: new URL("https://api.wit.ai/samples"),
        headers: {
            "Authorization": "Bearer " + process.env.WIT_SERVER_TOKEN,
            "Content-Type": 'application/json'
        },
    };

    let requestBody = [{
        text: question,
    }];

    try {
        await fetch(connection.url, {
            method: 'DELETE',
            headers: connection.headers,
            body: JSON.stringify(requestBody)
        });
        return true;
    } catch (err) {
        console.error("ERROR WHILE USING WIT API: " + err);
        return false;
    }
}

module.exports = {
    addNewValueToEntity,
    deleteValueFromEntity,
    deleteSample
}

