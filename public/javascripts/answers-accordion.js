function domReady(fn) {
    document.addEventListener("DOMContentLoaded", fn);
    if (document.readyState === "interactive" || document.readyState === "complete") {
        fn();
    }
}

domReady(() => {
    let acc = document.getElementsByClassName("accordion");
    let i;
    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function () {
            this.classList.toggle("active");
            let panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
                panel.style.maxHeight = 0;
              } else {
                panel.style.display = "block";
                panel.style.maxHeight = panel.scrollHeight + 'px';
              }
        });
    };
});