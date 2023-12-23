function populateLayouts(boardName) {
  fetch(`/api/v1/${boardName}/layouts`).then((response) => {
    response.json().then((layouts) => {
      const layoutSelect = document.getElementById("select-layout");
      layoutSelect.innerHTML = "";
      for (const [layoutId, layoutName] of layouts) {
        let option = document.createElement("option");
        option.text = layoutName;
        option.value = layoutId;
        layoutSelect.appendChild(option);
      }
      layoutSelect.addEventListener("change", function (event) {
        populateSizes(boardName, event.target.value);
      });
      populateSizes(boardName, layoutSelect.value);
    });
  });
}

function populateSizes(boardName, layoutId) {
  fetch(`/api/v1/${boardName}/layouts/${layoutId}/sizes`).then((response) => {
    response.json().then((sizes) => {
      const sizeSelect = document.getElementById("select-size");
      sizeSelect.innerHTML = "";
      for (const [sizeId, sizeName, sizeDescription] of sizes) {
        let option = document.createElement("option");
        option.text = `${sizeName} ${sizeDescription}`;
        option.value = sizeId;
        sizeSelect.appendChild(option);
      }
      sizeSelect.addEventListener("change", function (event) {
        populateSets(boardName, layoutId, event.target.value);
      });
      populateSets(boardName, layoutId, sizeSelect.value);
    });
  });
}

function populateSets(boardName, layoutId, productSizeId) {
  fetch(
    `/api/v1/${boardName}/layouts/${layoutId}/sizes/${productSizeId}/sets`
  ).then((response) => {
    response.json().then((sets) => {
      const setsDiv = document.getElementById("div-sets");
      setsDiv.innerHTML = "";
      for (const [setId, setName] of sets) {
        const inputGroupDiv = document.createElement("div");
        inputGroupDiv.className = "input-group mb-3";
        setsDiv.appendChild(inputGroupDiv);

        const span = document.createElement("span");
        span.className = "input-group-text";
        span.textContent = setName;
        inputGroupDiv.appendChild(span);

        const select = document.createElement("select");
        select.className = "form-select";
        select.setAttribute("data-set-id", setId);
        select.addEventListener("change", updateSetsInput);
        inputGroupDiv.appendChild(select);

        const optionEnabled = document.createElement("option");
        optionEnabled.text = "Enabled";
        optionEnabled.value = true;
        optionEnabled.selected = true;
        select.appendChild(optionEnabled);

        const optionDisabled = document.createElement("option");
        optionDisabled.text = "Disabled (coming soon)";
        optionDisabled.value = false;
        optionDisabled.disabled = true;
        select.appendChild(optionDisabled);
      }
      updateSetsInput();
    });
  });
}

function updateSetsInput() {
  const setsDiv = document.getElementById("div-sets");
  const setsInputsDiv = document.getElementById("div-sets-inputs");
  setsInputsDiv.innerHTML = "";
  let isOneSetEnabled = false;
  for (const select of setsDiv.querySelectorAll("select")) {
    if (select.value === "true") {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "set";
      input.value = select.getAttribute("data-set-id");
      setsInputsDiv.appendChild(input);
      isOneSetEnabled = true;
    }
  }
  document.getElementById("button-next").disabled = !isOneSetEnabled;
}

const boardSelect = document.getElementById("select-board");
boardSelect.addEventListener("change", function (event) {
  populateLayouts(event.target.value);
});

populateLayouts(boardSelect.value);
