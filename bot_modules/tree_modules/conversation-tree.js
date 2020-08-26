'use strict';

const chatbotDB = require('../database_modules/chatbot-DB.js');

//Inicializace stromů vytvořených z databáze
const initConversationTrees = async () => {
    try {
        let loadedTreeNodes = await loadTreeNodes();
        let builtTrees = buildConversationTrees(loadedTreeNodes);
        console.log('CHATBOT_LOG: Conversation trees for chatbot created successfully.');
        return builtTrees;
    } catch (err) {
        throw console.error('CHATBOT_ERROR: Chatbot was unable to create conversation trees!\n' + err);
    }
}

module.exports = {
    initConversationTrees
}

//Načte všechny uzly stromů z DB, přidá jim header informace a zorganizuje podle témat
async function loadTreeNodes() {
    let organizedNodes = [];
    let topics = await chatbotDB.getPossibleTopics();
    let headers = await chatbotDB.getAllHeaders();
    let nodes = await chatbotDB.getAnswerNodes();
    let quickReplies = await chatbotDB.getAllQuickReplies();
    let contents = await chatbotDB.getAllContents();

    topics.forEach(topic => {
          organizedNodes.push({topicName: topic.topicName, root: null, leaves: [] });
    });

    nodes.forEach(node => {
        let foundTopicObject = organizedNodes.find((element) => element.topicName === node.topicName);
        node['header'] = headers.find((header) => header.headerSpecification === node.specification);  
        node['quickReplies'] = quickReplies.filter((quickReply) => quickReply.idHeader === node.header.idHeader); 
        node['contents'] = contents.filter((content) => content.idHeader === node.header.idHeader);
        if (node.parentSpecification === null) {
            foundTopicObject.root = node;
        } else {
            foundTopicObject.leaves.push(node);
        }
    });
    return organizedNodes;
}

//Inicializuje jednotlivé stromy pro témata konverzací pomocí nalezených kořenů (uzel bez předků)
//Využívá organizaci uzlů podle témat pro zefektivnění přiřazení jednotlivých listů stromu
function buildConversationTrees(loadedTreeNodes) {
    let conversationTrees = {};
    let tree = null;
    Object.values(loadedTreeNodes).forEach((loadedObject) => {
        if(loadedObject.root !== null){
            tree = new Tree(formatTreeNode(loadedObject.root));
            assignLeaves(tree, [tree._root], loadedObject.leaves);
            conversationTrees[loadedObject.topicName] = tree;
        }    
    });
    return conversationTrees;
}

//Vyplňuje postupně strom, skládá postupně jednotlivé vrstvy uzlů
function assignLeaves(tree, currentLeaves, nodes) {
    let assignedNodes = [];
    let newLeaves = [];
    let formatted = null;
    currentLeaves.forEach(leaf => {
        nodes.forEach(node => {
            if (leaf.context === node.parentSpecification) {
                formatted = formatTreeNode(node);
                tree.add(formatted, leaf.context, tree.traverseBF);
                assignedNodes.push(node);
                newLeaves.push(formatted);
            }
        });
    });
    if (newLeaves.length === 0) {
        return;
    } else {
        assignLeaves(tree, newLeaves, removeAssignedNodes(nodes, assignedNodes));
    }
    return;
};

//Vytvoří JSONy ze stringu a naformátuje node z databáze tak, aby obsahoval pouze věci využívané ve stromu
function formatTreeNode(node) {
    let formatted = {
        context: node.specification,
        lastChoices: null,
        choices: null,
        header: node.header,
        intent: node.intent,
        quickReplies: node.quickReplies,
        contents: node.contents
    };
    let lastChoicesJSON = JSON.parse(node.connectedChoices);
    let choicesJSON = JSON.parse(node.possibleChoices);
    if (choicesJSON.choices.length > 0) {
        formatted.choices = choicesJSON.choices;
    }

    if (lastChoicesJSON.lastChoices.length > 0) {
        formatted.lastChoices = lastChoicesJSON.lastChoices;
    }
    return formatted;
}

//Smaže nody již přiřazené do stromu
function removeAssignedNodes(nodes, assignedNodes) {
    return nodes.filter(f => !assignedNodes.includes(f));
}



//Definice obecného konverzačního stromu
//-----------------------------------------
class Node {
    constructor(dataObject) {
        this.context = dataObject.context;
        this.lastChoices = dataObject.lastChoices;
        this.choices = dataObject.choices;
        this.header = dataObject.header;
        this.quickReplies = dataObject.quickReplies;
        this.contents = dataObject.contents;
        this.parent = null;
        this.children = [];
    }
}

class Tree {
    constructor(dataObject) {
        this._root = new Node(dataObject);
    }
    traverseBF(callback) {
        let queue = new Queue();
        queue.enqueue(this._root);
        let currentNode = queue.dequeue();
        while (currentNode) {
            for (let i = 0, length = currentNode.children.length; i < length; i++) {
                queue.enqueue(currentNode.children[i]);
            }
            callback(currentNode);
            currentNode = queue.dequeue();
        }
    }
    contains(callback, traversal) {
        traversal.call(this, callback);
    }
    add(dataObject, toContext, traversal) {
        let child = new Node(dataObject), parent = null, callback = function (node) {
            if (node.context === toContext) {
                parent = node;
            }
        };
        this.contains(callback, traversal);
        if (parent) {
            parent.children.push(child);
            child.parent = parent;
        }
        else {
            throw new Error('Cannot add node to a non-existent parent.');
        }
    }
    remove(dataObject, fromContext, traversal) {
        let tree = this, parent = null, childToRemove = null, index;
        let callback = function (node) {
            if (node.context === fromContext) {
                parent = node;
            }
        };
        this.contains(callback, traversal);
        if (parent) {
            index = findIndex(parent.children, dataObject);
            if (index === undefined) {
                throw new Error('Node to remove does not exist.');
            }
            else {
                childToRemove = parent.children.splice(index, 1);
            }
        }
        else {
            throw new Error('Parent does not exist.');
        }
        return childToRemove;
    }
}

function findIndex(arr, data) {
    let index;

    for (let i = 0; i < arr.length; i++) {
        if (arr[i].data === data) {
            index = i;
        }
    }

    return index;
}


//Pomocná definice fronty
class Queue {
    constructor() {
        this._oldestIndex = 1;
        this._newestIndex = 1;
        this._storage = {};
    }
    size() {
        return this._newestIndex - this._oldestIndex;
    }
    enqueue(data) {
        this._storage[this._newestIndex] = data;
        this._newestIndex++;
    }
    dequeue() {
        let oldestIndex = this._oldestIndex, newestIndex = this._newestIndex, deletedData;
        if (oldestIndex !== newestIndex) {
            deletedData = this._storage[oldestIndex];
            delete this._storage[oldestIndex];
            this._oldestIndex++;
            return deletedData;
        }
    }
}



