"use strict";
const resourceDB = require('../database_modules/resource-DB.js');

async function getCarouselElements(contextObject) {
  let criteriaObject = { positions: [], teacher: false, nextGroup: false };
  let carouselElements = null;
  if (contextObject.currentContext === 'oboryVyber') {
    carouselElements = await createFieldElements(contextObject.chosenStudy);
  } else if (contextObject.currentTopic === 'KATEDRA') {
    carouselElements = await createKatedraPeople(contextObject, criteriaObject);
  }
  return carouselElements;
}

module.exports = {
  getCarouselElements
}

async function createFieldElements(studyType) {
  let fieldsElements = [];
  let foundFields = await resourceDB.getFieldsByType(studyType);
  foundFields.forEach(element => {
    if (element.icon === null) element.icon = "https://i.imgur.com/32JpfEz.png";
    let field = {
      "title": element.fieldName,
      "image_url": element.icon,
      "subtitle": 'Katedra informatiky',
      "default_action": {
        "type": "web_url",
        "url": element.pageURL,
        "webview_height_ratio": "full"
      },
      "buttons": [
        { type: "postback", title: "Více k oboru", payload: element.idField },
        { type: "web_url", url: element.pageURL, title: "Stránky oboru" },
        { type: "web_url", url: "https://www.inf.upol.cz/pro-zajemce-o-studium/prijimaci-rizeni", title: "Přihláška" }
      ]
    }
    fieldsElements.push(field);
  });
  return fieldsElements;
}

async function createKatedraPeople(contextObject, criteriaObject) {
  switch (contextObject.currentContext) {
    case 'katedraUcitele':
      criteriaObject.positions = ['lektor', 'docent', 'profesor', 'odborný asistent'];
      break;
    case 'katedraVedeni':
      criteriaObject.positions = ['vedoucí katedry', 'zástupce ved. katedry pro výuku', 'zástupce ved. katedry pro rozvoj', 'sekretářka'];
      break;
    case 'katedraDalsiUcitele':
      criteriaObject.positions = ['lektor', 'docent', 'profesor', 'odborný asistent'];
      criteriaObject.nextGroup = true;
      break;
    case 'katedraSpravceSite':
      criteriaObject.positions.push('správce sítě');
      break;
    case 'katedraPhd':
      criteriaObject.positions.push('PhD student');
      break;
    case 'katedraExterniLektori':
      criteriaObject.positions.push('externí lektor');
      break;
  }
  return await createPeopleByCriteria(criteriaObject);
}

async function createPeopleByCriteria(criteriaObject) {
  let peopleArray = null;
  if (criteriaObject.positions !== null) {
    peopleArray = await resourceDB.getPeopleByPosition(criteriaObject.positions);

    if (criteriaObject.nextGroup) {
      peopleArray = peopleArray.slice(10);
    } else {
      peopleArray = peopleArray.slice(0, 10);
    }
  }
  return createPersonElements(peopleArray);
}

function createPersonElements(peopleArray) {
  let personArray = [];
  peopleArray.forEach(personElement => {
    let person = formatPersonElement(personElement);
    personArray.push(person);
  });
  return personArray;
}

function formatPersonElement(personElement) {
  let fullName = personElement.firstName + ' ' + personElement.lastName;
  let subtitle = [];
  let buttons = [];
  let person = null;
  if (personElement.titleBefore !== null) fullName = personElement.titleBefore + ' ' + fullName;
  if (personElement.titleAfter !== null) fullName += personElement.titleAfter;
  if (personElement.picture === null) personElement.picture = "https://i.imgur.com/PMdqeQh.png";
  person = { "title": fullName, "image_url": personElement.picture };

  if (personElement.position !== null) subtitle.push(personElement.position);
  if (personElement.office !== null) subtitle.push('🚪 ' + personElement.office);
  if (personElement.email !== null) subtitle.push('📧 ' + personElement.email);
  if (personElement.phone !== null) subtitle.push('☎️ ' + personElement.phone);
  person['subtitle'] = subtitle.join('\n');

  if (personElement.profile !== null) buttons.push({ type: "web_url", url: personElement.profile, title: "Profil" });
  if (personElement.teachingPage !== null) buttons.push({ type: "web_url", url: personElement.teachingPage, title: "Osobní stránky" });
  if (buttons.length > 0) person['buttons'] = buttons;
  return person;
}
