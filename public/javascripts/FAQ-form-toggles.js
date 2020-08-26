function toggleFAQforms(checkboxId) {
    let checked = document.getElementById(checkboxId).checked;
    let existingAnswer = document.getElementById("existingAnswer");
    let newAnswer = document.getElementById("newAnswer");
    let topicSelect = document.getElementById("topicSelect");
    let contextSelect = document.getElementById("contextSelect");
    if (checked) {
        existingAnswer.classList.remove("hidden--block");
        newAnswer.classList.add("hidden--block");
        topicSelect.disabled = false;
        contextSelect.disabled = false;
        topicSelect.removeAttribute('required');
        contextSelect.removeAttribute('required');
        document.getElementsByName("answerType").forEach(e => e.removeAttribute('required'));
    } else {
        existingAnswer.classList.add("hidden--block");
        newAnswer.classList.remove("hidden--block");
        topicSelect.disabled = true;
        contextSelect.disabled = true;
        topicSelect.setAttribute('required', true);
        contextSelect.setAttribute('required', true);
        document.getElementsByName("answerType").forEach(e => e.setAttribute('required', true));
    }
}

function domReady(fn) {
    document.addEventListener("DOMContentLoaded", fn);
    if (document.readyState === "interactive" || document.readyState === "complete") {
        fn();
    }
}


domReady(() => {
    if(document.getElementById("answerInTree").checked) {
        document.getElementById("newAnswer").classList.add("hidden--block");
        document.getElementById("existingAnswer").classList.remove("hidden--block");
        document.getElementsByName("answerType").forEach(e => e.removeAttribute('required'));
    } else {
        document.getElementById("existingAnswer").classList.add("hidden--block");
        document.getElementById("newAnswer").classList.remove("hidden--block");
        document.getElementById("topicSelect").removeAttribute('required');
        document.getElementById("contextSelect").removeAttribute('required');
    }
});



