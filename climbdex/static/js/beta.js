function clickBetaButton(index) {
  document.querySelector(`button[data-index="${index}"]`)?.click();
}

const betaButtons = document.querySelectorAll("[data-link]");
betaButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const link = event.target.getAttribute("data-link");
    const handle = event.target.getAttribute("data-handle");
    const betaIframeDiv = document.getElementById("div-beta-iframe");
    betaIframeDiv.innerHTML = "";
    const iframe = document.createElement("iframe");
    betaIframeDiv.appendChild(iframe);
    iframe.src = link + "embed";
    const handleHeader = document.getElementById("header-handle");
    handleHeader.innerHTML = handle;
    document.getElementById("div-beta")?.scrollIntoView(true);

    const index = Number(event.target.getAttribute("data-index"));
    const buttonPrev = document.getElementById("button-prev");
    buttonPrev.onclick = () => {
      clickBetaButton(index - 1);
    };
    buttonPrev.disabled = index <= 0;

    const buttonNext = document.getElementById("button-next");
    buttonNext.onclick = () => {
      clickBetaButton(index + 1);
    };
    buttonNext.disabled = index >= betaButtons.length - 1;
  });
});

const backAnchor = document.getElementById("anchor-back");
backAnchor.href = location.origin;
if (document.referrer && new URL(document.referrer).origin == location.origin) {
  backAnchor.addEventListener("click", function (event) {
    event.preventDefault();
    history.back();
  });
}
