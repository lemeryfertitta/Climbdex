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
      td.textContent = climb_data[dataOffset + dataIndexOffset];
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
  for (const [climb_uuid, climb_data] of Object.entries(climbs)) {
    climb_string = climb_data[1];
    if (climb_string.match(regexp)) {
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

function getAngleListItem(angle) {
  let li = document.createElement("li");
  li.setAttribute("class", "dropdown-item");
  li.appendChild(document.createTextNode(angle));
  li.addEventListener("click", function () {
    const angleButton = document.getElementById("angle-filter");
    angleButton.textContent = "Angle: " + angle;
  });
  return li;
}

function populateAngleFilter() {
  const angleList = document.getElementById("angle-list");
  for (const angle of angles) {
    angleList.appendChild(getAngleListItem(angle));
  }
  angleList.appendChild(getAngleListItem("Any"));
}

document.getElementById("reset-button").addEventListener("click", resetFilter);

drawHoldCircles();
populateAngleFilter();
