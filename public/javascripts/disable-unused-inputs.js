function switchInputs(radioBtnId) {
    let text = document.getElementById("textAnswer");
    let url = document.getElementById("urlAnswer");
    let img = document.getElementById("imageAnswer");
    let video = document.getElementById("videoAnswer");
    clearContent();
    switch (radioBtnId) {
        case "Text":
            text.disabled = false;

            url.disabled = true;
            img.disabled = true;
            video.disabled = true;
            break;
        case "TextURL":
            text.disabled = false
            url.disabled = false;
            img.disabled = true;
            video.disabled = true;
            break;
        case "Obrázek": ;
            text.disabled = true;
            url.disabled = true;
            img.disabled = false;
            video.disabled = true;
            break;
        case "Video": ;
            text.disabled = true;
            url.disabled = true;
            img.disabled = true;
            video.disabled = false;
            break;
    }
}

function clearContent() {
    document.getElementById("textAnswer").value = "";
    document.getElementById("urlAnswer").value = "";
    document.getElementById("imageAnswer").value = "";
    document.getElementById("videoAnswer").value = "";
}

