const ANGLES_SQL = `
SELECT
  angle
FROM products_angles
JOIN layouts
ON layouts.product_id = products_angles.product_id
WHERE layouts.id = $layoutId
`;

const GRADES_SQL = `
SELECT
  difficulty,
  boulder_name
FROM difficulty_grades
WHERE is_listed = 1
ORDER BY difficulty ASC
`;

function onFilterCircleClick(circleElement, colors) {
  const holdId = circleElement.id.split("-")[1];
  const currentColor = circleElement.getAttribute("stroke");

  const colorList = Object.keys(colors)
    .sort()
    .map((colorId) => colors[colorId]);

  const colorsToId = {};
  for (const colorId of Object.keys(colors)) {
    colorsToId[colors[colorId]] = colorId;
  }

  let currentIndex = colorList.indexOf(currentColor);
  let nextIndex = currentIndex + 1;
  const holdFilterInput = document.getElementById("input-hold-filter");
  if (nextIndex >= colorList.length) {
    circleElement.setAttribute("stroke-opacity", 0.0);
    circleElement.setAttribute("stroke", "black");
    holdFilterInput.value = holdFilterInput.value.replace(
      `p${holdId}r${colorsToId[currentColor]}`,
      ""
    );
  } else {
    circleElement.setAttribute("stroke", `${colorList[nextIndex]}`);
    circleElement.setAttribute("stroke-opacity", 1.0);
    if (currentIndex == -1) {
      holdFilterInput.value += `p${holdId}r${colorsToId[colorList[nextIndex]]}`;
    } else {
      holdFilterInput.value = holdFilterInput.value.replace(
        `p${holdId}r${colorsToId[currentColor]}`,
        `p${holdId}r${colorsToId[colorList[nextIndex]]}`
      );
    }
  }
}

function updateMaxOnMinChange(event) {
  const minGradeFilter = event.target;
  const maxGradeFilter = document.getElementById("max-grade-filter");
  if (minGradeFilter.value > maxGradeFilter.value) {
    maxGradeFilter.value = minGradeFilter.value;
    maxGradeFilter.text = minGradeFilter.text;
  }
}

function updateMinOnMaxChange(event) {
  const minGradeFilter = document.getElementById("min-grade-filter");
  const maxGradeFilter = event.target;
  if (minGradeFilter.value > maxGradeFilter.value) {
    minGradeFilter.value = maxGradeFilter.value;
    minGradeFilter.text = maxGradeFilter.text;
  }
}

function populateAngleSelect(db, layoutId) {
  const results = db.exec(ANGLES_SQL, { $layoutId: layoutId });
  const angleSelect = document.getElementById("select-angle");
  for (const angle of results[0].values) {
    let option = document.createElement("option");
    option.text = angle;
    option.value = angle;
    angleSelect.appendChild(option);
  }
}

function populateGradeSelects(db) {
  const results = db.exec(GRADES_SQL);
  const minGradeSelect = document.getElementById("select-min-grade");
  const maxGradeSelect = document.getElementById("select-max-grade");
  for (
    let resultIndex = 0;
    resultIndex < results[0].values.length;
    resultIndex++
  ) {
    const [difficulty, boulderName] = results[0].values[resultIndex];
    let minOption = document.createElement("option");
    minOption.value = difficulty;
    minOption.text = boulderName;
    minOption.selected = resultIndex == 0;
    minGradeSelect.appendChild(minOption);

    let maxOption = minOption.cloneNode(true);
    maxOption.selected = resultIndex == results[0].values.length - 1;
    maxGradeSelect.appendChild(maxOption);
  }

  minGradeSelect.addEventListener("change", updateMaxOnMinChange);
  maxGradeSelect.addEventListener("change", updateMinOnMaxChange);
}

document
  .getElementById("div-hold-filter")
  .addEventListener("shown.bs.collapse", function (event) {
    event.target.scrollIntoView(true);
  });

const params = new URLSearchParams(window.location.search);
const indexParamsInputDiv = document.getElementById("div-index-params-inputs");
for (const [key, value] of params) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = key;
  input.value = value;
  indexParamsInputDiv.appendChild(input);
}

getDatabase("kilter").then((db) => {
  console.log(params.getAll("set"));
  populateAngleSelect(db, params.get("layout"));
  populateGradeSelects(db);
  drawBoard(
    document.getElementById("svg-hold-filter"),
    db,
    params.get("layout"),
    params.get("size"),
    params.getAll("set"),
    (event) => {
      onFilterCircleClick(event.target, getColors(db, params.get("layout")));
    }
  );
});
