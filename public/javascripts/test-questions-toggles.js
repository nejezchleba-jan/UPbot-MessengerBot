function toggleInputs() {
    let inputText = document.getElementById("text");
    let inputImg = document.getElementById("img");
    let checkedVal = getCheckedValue("questionType");
    if (checkedVal === 'text') {
        inputText.disabled = false;
        inputText.required = true;

        inputImg.disabled = true;
        inputImg.required = false;
    } else {
        inputText.disabled = true;
        inputText.required = false;

        inputImg.disabled = false;
        inputImg.required = true;
    }
}

function changeLetters(value) {
    let lettersSelect = document.getElementById("correctAnswer").getElementsByTagName("option");
    for(let i = 0; i < value; i++) {
        lettersSelect[i].hidden = false;
    }
    for(let i = value; i < lettersSelect.length; i++) {
        lettersSelect[i].hidden = true;
    }
}


function domReady(fn) {
    document.addEventListener("DOMContentLoaded", fn);
    if (document.readyState === "interactive" || document.readyState === "complete") {
        fn();
    }
}

function getCheckedValue(groupName) {
    let radios = document.getElementsByName(groupName);
    for( i = 0; i < radios.length; i++ ) {
        if( radios[i].checked ) {
            return radios[i].value;
        }
    }
    return null;
}

domReady(() => {
    let radios = document.getElementsByName("questionType");
    for( i = 0; i < radios.length; i++ ) {
        radios[i].addEventListener("click", toggleInputs, false);
    }
    changeLetters(document.getElementById("answerCount").value);
});