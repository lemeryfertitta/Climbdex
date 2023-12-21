const LAYOUTS_SQL = `
SELECT id, name
FROM layouts
WHERE is_listed=1
AND password IS NULL;
`;

const PRODUCT_SIZES_SQL = `
SELECT 
    product_sizes.id,
    product_sizes.name,
    product_sizes.description
FROM product_sizes
INNER JOIN layouts
ON product_sizes.product_id = layouts.product_id
WHERE layouts.id = $layoutId
`;

const SETS_SQL = `
SELECT 
    sets.id,
    sets.name
FROM sets
INNER JOIN product_sizes_layouts_sets psls on sets.id = psls.set_id
WHERE psls.product_size_id = $productSizeId
AND psls.layout_id = $layoutId
`;

function populateLayouts(db) {
  const results = db.exec(LAYOUTS_SQL);
  const layoutSelect = document.getElementById("select-layout");
  for (const [layoutId, layoutName] of results[0].values) {
    let option = document.createElement("option");
    option.text = layoutName;
    option.value = layoutId;
    layoutSelect.appendChild(option);
  }
  layoutSelect.addEventListener("change", function (event) {
    populateSizes(db, event.target.value);
  });
  populateSizes(db, layoutSelect.value);
}

function populateSizes(db, layoutId) {
  const results = db.exec(PRODUCT_SIZES_SQL, { $layoutId: layoutId });
  const sizeSelect = document.getElementById("select-size");
  sizeSelect.innerHTML = "";
  for (const [sizeId, sizeName, sizeDescription] of results[0].values) {
    let option = document.createElement("option");
    option.text = `${sizeName} ${sizeDescription}`;
    option.value = sizeId;
    sizeSelect.appendChild(option);
  }
  sizeSelect.addEventListener("change", function (event) {
    populateSets(db, layoutId, event.target.value);
  });
  populateSets(db, layoutId, sizeSelect.value);
}

function populateSets(db, layoutId, productSizeId) {
  const results = db.exec(SETS_SQL, {
    $layoutId: layoutId,
    $productSizeId: productSizeId,
  });
  console.log(results);
  const setsDiv = document.getElementById("div-sets");
  setsDiv.innerHTML = "";
  for (const [setId, setName] of results[0].values) {
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
    optionDisabled.text = "Disabled";
    optionDisabled.value = false;
    select.appendChild(optionDisabled);
  }
  updateSetsInput();
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

getDatabase("data/tension/metadata.sqlite3.gz").then((db) => {
  populateLayouts(db);
});
