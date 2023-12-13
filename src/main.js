const colors = ["#4cf0fd", "#00ff00", "#fbe400", "#ff00ff"];
const colorsToString = {
  "#4cf0fd": "13",
  "#00ff00": "12",
  "#fbe400": "15",
  "#ff00ff": "14",
};
const stringToColors = {
  13: "#4cf0fd",
  12: "#00ff00",
  15: "#fbe400",
  14: "#ff00ff",
};
const filteredHoldsToColors = {};

let climbHolds = [];
let currentClimb;

function getCircle(id, x, y, radius) {
  let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("id", id);
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.setAttribute("r", radius);
  circle.setAttribute("fill-opacity", 0.0);
  circle.setAttribute("stroke-opacity", 0.0);
  circle.setAttribute("stroke-width", 6);
  return circle;
}

function drawFilterCircle(id, x, y, radius) {
  let circle = getCircle(id, x, y, radius);
  circle.onclick = function (event) {
    const currentColor = event.target.getAttribute("stroke");
    let currentIndex = colors.indexOf(currentColor);
    let nextIndex = currentIndex + 1;
    let holdId = event.target.id.split("-")[1];
    if (nextIndex >= colors.length) {
      event.target.setAttribute("stroke-opacity", 0.0);
      event.target.setAttribute("stroke", "black");
      delete filteredHoldsToColors[holdId];
    } else {
      event.target.setAttribute("stroke", colors[nextIndex]);
      event.target.setAttribute("stroke-opacity", 1.0);
      filteredHoldsToColors[holdId] = colors[nextIndex];
    }
  };
  document.getElementById("filter-svg").appendChild(circle);
}

function drawClimbCircle(id, x, y, radius) {
  let circle = getCircle(id, x, y, radius);
  document.getElementById("climb-svg").appendChild(circle);
}

function drawHoldCircles() {
  let xOffset = 184;
  let xSpacing = 1477 / 192;
  let yOffset = 1200;
  let ySpacing = 1200 / 156;
  for (const [hold_id, coords] of Object.entries(holds)) {
    let x = coords[0] * xSpacing + xOffset;
    let y = yOffset - coords[1] * ySpacing;
    drawFilterCircle(`filter-${hold_id}`, x, y, 30);
    drawClimbCircle(`climb-${hold_id}`, x, y, 30);
  }
}

function drawClimb(climb_uuid) {
  const climb_data = climbs[climb_uuid];

  const climbName = climb_data[0];
  document.getElementById("climb-name").textContent = climbName;

  const climb_string = climb_data[1];
  const hold_strings = climb_string.split("p");
  for (const hold_string of hold_strings) {
    if (hold_string.length > 0) {
      const [hold_id, color_string] = hold_string.split("r");
      const color = stringToColors[color_string];
      const circle = document.getElementById(`climb-${hold_id}`);
      circle.setAttribute("stroke", color);
      circle.setAttribute("stroke-opacity", 1.0);
      climbHolds.push(hold_id);
    }
  }

  const numAngles = (climb_data.length - 3) / 4;
  const climbStats = document.getElementById("climb-stats");
  climbStats.innerHTML = "";
  for (let angleIndex = 0; angleIndex < numAngles; angleIndex++) {
    const tr = document.createElement("tr");
    const dataIndexOffset = 2 + angleIndex * 4;
    for (let dataOffset = 0; dataOffset < 4; dataOffset++) {
      const td = document.createElement("td");
      let text = climb_data[dataOffset + dataIndexOffset];
      if (dataOffset == 1) {
        text = grades[Math.round(Number(text))];
      }
      td.textContent = text;
      tr.appendChild(td);
    }
    climbStats.appendChild(tr);
  }
}

function eraseClimb() {
  for (const hold_id of climbHolds) {
    const circle = document.getElementById(`climb-${hold_id}`);
    circle.setAttribute("stroke-opacity", 0.0);
  }
  climbHolds.length = 0;
  document.getElementById("climb-name").textContent = "";
  document.getElementById("climb-stats").innerHTML = "";
}

function resetFilter() {
  for (const hold_id of Object.keys(filteredHoldsToColors)) {
    const circle = document.getElementById(`filter-${hold_id}`);
    circle.setAttribute("stroke-opacity", 0.0);
    circle.setAttribute("stroke", "black");
    delete filteredHoldsToColors[hold_id];
  }
  document.getElementById("match-results").innerHTML = "";
  eraseClimb();
  setDefaultFilterOptions();
}

function matchesFilters(
  climbData,
  angle,
  minGrade,
  maxGrade,
  minAscents,
  minQuality
) {
  const numAngles = (climbData.length - 3) / 4;
  for (let angleIndex = 0; angleIndex < numAngles; angleIndex++) {
    const dataIndexOffset = 2 + angleIndex * 4;
    const grade = climbData[dataIndexOffset + 1];
    const numAscents = climbData[dataIndexOffset + 2];
    const quality = climbData[dataIndexOffset + 3];
    if (angle == climbData[dataIndexOffset]) {
      return (
        grade >= minGrade &&
        grade <= maxGrade &&
        numAscents >= minAscents &&
        quality >= minQuality
      );
    } else if (angle == "Any") {
      if (
        grade >= minGrade &&
        grade <= maxGrade &&
        numAscents >= minAscents &&
        quality >= minQuality
      ) {
        return true;
      }
    }
  }
  return false;
}

document.getElementById("search-button").addEventListener("click", function () {
  const maxMatches = 40;
  const matchResults = document.getElementById("match-results");
  matchResults.innerHTML = "";
  let subStrings = [];
  for (const [holdId, color] of Object.entries(filteredHoldsToColors)) {
    subStrings.push("p" + holdId + "r" + colorsToString[color]);
  }
  subStrings.sort();
  let regexp = new RegExp(subStrings.join(".*"));
  let matchCount = 0;
  const angle = document.getElementById("angle-filter").value;
  const minGrade = document.getElementById("min-grade-filter").value;
  const maxGrade = document.getElementById("max-grade-filter").value;
  const minAscents = document.getElementById("min-ascents-filter").value;
  const minQuality = document.getElementById("min-quality-filter").value;
  for (const [climb_uuid, climb_data] of Object.entries(climbs)) {
    climb_string = climb_data[1];
    if (
      climb_string.match(regexp) &&
      matchesFilters(
        climb_data,
        angle,
        minGrade,
        maxGrade,
        minAscents,
        minQuality
      )
    ) {
      let listButton = document.createElement("button");
      listButton.setAttribute("data-climb-uuid", climb_uuid);
      listButton.setAttribute(
        "class",
        "list-group-item list-group-item-action"
      );
      listButton.addEventListener("click", function (event) {
        if (currentClimb) {
          currentClimb.setAttribute(
            "class",
            "list-group-item list-group-item-action"
          );
        }
        event.target.setAttribute(
          "class",
          "list-group-item list-group-item-action active"
        );
        const climb_uuid = event.target.getAttribute("data-climb-uuid");
        eraseClimb();
        drawClimb(climb_uuid);
        currentClimb = event.target;
      });
      listButton.appendChild(document.createTextNode(climb_data[0]));
      matchResults.appendChild(listButton);
      matchCount++;
      if (matchCount >= maxMatches) {
        break;
      }
    }
  }
  if (matchCount == 0) {
    let pElement = document.createTextNode("p");
    pElement.textContent = "No matches found";
    matchResults.appendChild(pElement);
  }
});

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

function populateFilterOptions() {
  const angleFilter = document.getElementById("angle-filter");
  for (const angle of angles) {
    let option = document.createElement("option");
    option.value = angle;
    option.text = angle;
    angleFilter.appendChild(option);
  }

  const minGradeFilter = document.getElementById("min-grade-filter");
  const maxGradeFilter = document.getElementById("max-grade-filter");

  for (const [difficulty, boulder_name] of Object.entries(grades)) {
    let option = document.createElement("option");
    option.value = difficulty;
    option.text = boulder_name;
    minGradeFilter.appendChild(option);
    maxGradeFilter.appendChild(option.cloneNode(true));
  }

  minGradeFilter.addEventListener("change", updateMaxOnMinChange);
  maxGradeFilter.addEventListener("change", updateMinOnMaxChange);
  setDefaultFilterOptions();
}

function setDefaultFilterOptions() {
  document
    .getElementById("angle-filter")
    .querySelector("option[value='Any']").selected = true;

  const sortedGrades = Object.keys(grades).map(Number).sort();
  const minGrade = sortedGrades[0];
  const maxGrade = sortedGrades[sortedGrades.length - 1];
  document
    .getElementById("min-grade-filter")
    .querySelector(`option[value="${minGrade}"`).selected = true;
  document
    .getElementById("max-grade-filter")
    .querySelector(`option[value="${maxGrade}"`).selected = true;

  document.getElementById("min-quality-filter").value = 1.0;
  document.getElementById("min-ascents-filter").value = 1;
}

document.getElementById("reset-button").addEventListener("click", resetFilter);

drawHoldCircles();
populateFilterOptions();
