const colors = ["#4cf0fd", "#00ff00", "#fbe400", "#ff00ff"];
const colorsToString = {
  "#4cf0fd": "13",
  "#00ff00": "12",
  "#fbe400": "15",
  "#ff00ff": "14",
};
const selected = {};

function drawCircle(id, x, y, radius) {
  let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("id", id);
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.setAttribute("r", radius);
  circle.setAttribute("fill-opacity", 0.0);
  circle.setAttribute("stroke-opacity", 0.0);
  circle.setAttribute("stroke-width", 6);
  circle.onclick = function (event) {
    const currentColor = event.target.getAttribute("stroke");
    let currentIndex = colors.indexOf(currentColor);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= colors.length) {
      event.target.setAttribute("stroke-opacity", 0.0);
      event.target.setAttribute("stroke", "black");
      delete selected[event.target.id];
    } else {
      event.target.setAttribute("stroke", colors[nextIndex]);
      event.target.setAttribute("stroke-opacity", 1.0);
      selected[event.target.id] = colors[nextIndex];
    }
  };
  document.getElementById("board-svg").appendChild(circle);
}

function drawHoldCircles() {
  let xOffset = 184;
  let xSpacing = 1477 / 192;
  let yOffset = 1200;
  let ySpacing = 1200 / 156;
  for (const [hold, coords] of Object.entries(holds)) {
    let x = coords.x * xSpacing + xOffset;
    let y = yOffset - coords.y * ySpacing;
    drawCircle(hold, x, y, 30);
  }
}

document.getElementById("search-button").addEventListener("click", function () {
  let subStrings = [];
  for (const [id, color] of Object.entries(selected)) {
    subStrings.push("p" + id + "r" + colorsToString[color]);
  }
  subStrings.sort();
  let regexp = new RegExp(subStrings.join(".*"));
  let matching_climbs = [];
  for (const [climb_uuid, name, climb_string] of climbs) {
    if (climb_string.match(regexp)) {
      matching_climbs.push(name);
    }
  }
  const matchList = document.getElementById("match-list");
  matchList.innerHTML = "";
  for (const name of matching_climbs) {
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(name));
    matchList.appendChild(li);
  }
});

drawHoldCircles();
