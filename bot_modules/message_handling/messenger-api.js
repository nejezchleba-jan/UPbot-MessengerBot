"use strict";
const fetch = require("node-fetch");

const sendToMessenger = async (senderPSID, response) => {
  let requestBody = {
    "recipient": {
      "id": senderPSID
    },
    "message": response
  }
  await simulateTyping(senderPSID);
  return await sendRequest(requestBody);
}

const createSimpleAttachment = function (type, attachment) {
  return {
    "type": type,
    "payload": { "url": attachment }
  };
}

const createURLButton = function (contentObject) {
  return {
    "type": "template",
    "payload": {
      "template_type": "button",
      "text": contentObject.text,
      "buttons": [
        {
          "type": "web_url",
          "url": contentObject.url,
          "title": "👉(Odkaz)👈"
        }
      ]
    }
  }
}

function createCarousel(elementArray) {
  return {
    "type": "template",
    "payload": {
      "template_type": "generic",
      "image_aspect_ratio": "square",
      "elements": elementArray
    }
  };
}

const createQuickReplies = function (headerInfo, quickReplies) {
  let quickRepliesArray = [];
  if (quickReplies !== null && quickReplies.length > 0) {
    formatQuickReplies(quickRepliesArray, quickReplies);
  }
  if (headerInfo.conversationEnding) {
    quickRepliesArray.push({ content_type: 'text', title: 'MENU', payload: 'MENU' });
  }
  if (headerInfo.returnAllowed) {
    quickRepliesArray.push({ content_type: 'text', title: 'ZPĚT ⤴', payload: 'RETURN' });
  }
  return quickRepliesArray;
}

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  createQuickReplies,
  createSimpleAttachment,
  createURLButton,
  createCarousel,
  sendToMessenger,
  timeout
}

function formatQuickReplies(quickRepliesArray, quickReplies) {
  let formattedQR = null;
  quickReplies.forEach(element => {
    formattedQR = { content_type: 'text', title: null, payload: null };
    formattedQR.title = element.text;
    formattedQR.payload = element.payload;
    if (element.img !== null) formattedQR['image_url'] = element.img;
    quickRepliesArray.push(formattedQR);
  });
}

async function simulateTyping(idUser) {
  await markAsSeen(idUser);
  await typingOn(idUser);
}

async function markAsSeen(senderPSID) {
  let requestBody = {
    recipient: { id: senderPSID },
    sender_action: "mark_seen"
  }
  await sendRequest(requestBody);
}

async function typingOn(senderPSID) {
  let requestBody = {
    recipient: { id: senderPSID },
    sender_action: "typing_on"
  }
  await sendRequest(requestBody);
  await timeout(150);
}

async function sendRequest(requestBody) {
  let connection = {
    url: new URL('https://graph.facebook.com/v6.0/me/messages?access_token=' + process.env.FACEBOOK_ACCESS_TOKEN),
    headers: {'Content-Type': 'application/json'},
  }
  try {
    await fetch(connection.url, {
      method: 'POST',
      headers: connection.headers,
      body: JSON.stringify(requestBody)
    });
    return true;
  } catch(err) {
    console.log("ERROR: Could not send request to Messenger." + err);
    return false;
  }
}