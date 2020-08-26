function showSecondSelect() {
    let selectTopic = document.getElementById('topicSelect');
    let selectedText = selectTopic.options[selectTopic.selectedIndex].text;
    let contextSelect = document.getElementById('contextSelect');
    let selectGroups = contextSelect.getElementsByTagName('optgroup');
    for (var i = 0; i < selectGroups.length; i++) {
        if (selectGroups[i].getAttribute('label') === selectedText) {
            if(selectGroups[i].lastChild === null) {
                let newElement = document.createElement('option');
                newElement.value = "-1";
                newElement.textContent = "--ŽÁDNÝ MOŽNÝ KONTEXT--";
                newElement.selected = true;
                newElement.disabled = true;
                selectGroups[i].appendChild(newElement);
            }
            contextSelect.options[1].selected = true;    
            selectGroups[i].disabled = false;
            selectGroups[i].hidden = false;
        } else {
            selectGroups[i].disabled = true;
            selectGroups[i].hidden = true;
        }
    }
    if (contextSelect.options[contextSelect.selectedIndex] !== undefined) {
        contextSelect.options[contextSelect.selectedIndex].selected = false;   
    }
    contextSelect.disabled = false;
}