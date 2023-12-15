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
let currentClimb = null;
let productDimensions = {};

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

function drawHoldCircles(imageWidth, imageHeight, productData) {
  let xSpacing = imageWidth / (productData.edge_right - productData.edge_left);
  let ySpacing = imageHeight / (productData.edge_top - productData.edge_bottom);
  for (const [hold_id, coords] of Object.entries(holds)) {
    if (
      coords[0] < productData.edge_left ||
      coords[0] > productData.edge_right ||
      coords[1] < productData.edge_bottom ||
      coords[1] > productData.edge_top
    ) {
      continue;
    }
    let x = (coords[0] - productData.edge_left) * xSpacing;
    let y = imageHeight - (coords[1] - productData.edge_bottom) * ySpacing;
    drawFilterCircle(`filter-${hold_id}`, x, y, xSpacing * 4);
    drawClimbCircle(`climb-${hold_id}`, x, y, xSpacing * 4);
  }
}

function drawClimb(climbUuid) {
  const climbData = climbs[climbUuid];

  const climbName = climbData[0];
  const climbLink = document.createElement("a");
  climbLink.textContent = climbName;
  climbLink.href = `https://kilterboardapp.com/climbs/${climbUuid}`;
  climbLink.target = "_blank";
  climbLink.rel = "noopener noreferrer";
  document.getElementById("climb-name").innerHTML = climbLink.outerHTML;

  const climbString = climbData[1];
  const holdStrings = climbString.split("p");
  for (const holdString of holdStrings) {
    if (holdString.length > 0) {
      const [holdId, color_string] = holdString.split("r");
      const color = stringToColors[color_string];
      const circle = document.getElementById(`climb-${holdId}`);
      circle.setAttribute("stroke", color);
      circle.setAttribute("stroke-opacity", 1.0);
      climbHolds.push(holdId);
    }
  }

  const climbStatsTable = document.getElementById("climb-stats-table");
  climbStatsTable.innerHTML = "";
  const climbAngles = climbStats[climbUuid];
  if (climbAngles != undefined) {
    for (const [angle, angleData] of Object.entries(climbAngles)) {
      const tr = document.createElement("tr");
      const angleTd = document.createElement("td");
      angleTd.textContent = angle;
      tr.appendChild(angleTd);

      const gradeTd = document.createElement("td");
      gradeTd.textContent = grades[Math.round(Number(angleData[0]))];
      tr.appendChild(gradeTd);

      const ascentsTd = document.createElement("td");
      ascentsTd.textContent = angleData[1];
      tr.appendChild(ascentsTd);

      const qualityTd = document.createElement("td");
      qualityTd.textContent = angleData[2];
      tr.appendChild(qualityTd);

      climbStatsTable.appendChild(tr);
    }
  }
}

function eraseClimb() {
  for (const hold_id of climbHolds) {
    const circle = document.getElementById(`climb-${hold_id}`);
    if (circle != null) {
      circle.setAttribute("stroke-opacity", 0.0);
    }
  }
  climbHolds.length = 0;
  document.getElementById("climb-name").textContent = "";
  document.getElementById("climb-stats-table").innerHTML = "";
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
  climbUuid,
  angle,
  minGrade,
  maxGrade,
  minAscents,
  minQuality
) {
  const climbAngles = climbStats[climbUuid];
  if (climbAngles == undefined) {
    return angle == "Any" && minAscents == 0;
  } else if (angle == "Any") {
    for (const angleData of Object.values(climbAngles)) {
      if (
        angleData[0] >= minGrade &&
        angleData[0] <= maxGrade &&
        angleData[1] >= minAscents &&
        angleData[2] >= minQuality
      ) {
        return true;
      }
    }
    return false;
  } else {
    const angleData = climbAngles[angle];
    if (angleData == undefined) {
      return false;
    }
    return (
      angleData[0] >= minGrade &&
      angleData[0] <= maxGrade &&
      angleData[1] >= minAscents &&
      angleData[2] >= minQuality
    );
  }
}

function fitsProductSize(climbData) {
  return (
    climbData[2] >= productDimensions.edgeLeft &&
    climbData[3] <= productDimensions.edgeRight &&
    climbData[4] >= productDimensions.edgeBottom &&
    climbData[5] <= productDimensions.edgeTop
  );
}

function filterClimbs() {
  const maxMatches = 40;
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
  const filteredClimbs = [];
  for (const [climbUuid, climbData] of Object.entries(climbs)) {
    climb_string = climbData[1];
    if (
      climb_string.match(regexp) &&
      fitsProductSize(climbData) &&
      matchesFilters(
        climbUuid,
        angle,
        minGrade,
        maxGrade,
        minAscents,
        minQuality
      )
    ) {
      filteredClimbs.push([climbUuid].concat(climbData));
      matchCount++;
      if (matchCount >= maxMatches) {
        break;
      }
    }
  }
  return filteredClimbs;
}

function getTotalAscents(climbUuid, angle) {
  const climbAngles = climbStats[climbUuid];
  if (climbAngles == undefined) {
    return 0;
  } else if (angle == "Any") {
    let totalAscents = 0;
    for (const angleData of Object.values(climbAngles)) {
      totalAscents += angleData[1];
    }
    return totalAscents;
  } else {
    return climbAngles[angle][1];
  }
}

function getAverageQuality(climbUuid, angle) {
  const climbAngles = climbStats[climbUuid];
  if (climbAngles == undefined) {
    return undefined;
  } else if (angle == "Any") {
    let totalAscents = getTotalAscents(climbUuid, angle);
    let weightedAverageQuality = 0;
    for (const angleData of Object.values(climbAngles)) {
      weightedAverageQuality += angleData[2] * (angleData[1] / totalAscents);
    }
    return weightedAverageQuality;
  } else {
    return climbAngles[angle][2];
  }
}

function getExtremeDifficulty(climbUuid, angle, isMax) {
  const climbAngles = climbStats[climbUuid];
  if (climbAngles == undefined) {
    return undefined;
  } else if (angle == "Any") {
    const compareFunc = isMax ? Math.max : Math.min;
    let extremeDifficulty;
    for (const angleData of Object.values(climbAngles)) {
      if (extremeDifficulty == undefined) {
        extremeDifficulty = angleData[0];
      } else {
        extremeDifficulty = compareFunc(extremeDifficulty, angleData[0]);
      }
    }
    return extremeDifficulty;
  } else {
    return climbAngles[angle][0];
  }
}

function sortClimbs(climbList) {
  const sortCategory = document.getElementById("sort-category").value;
  const reverse = document.getElementById("sort-order").value == "desc";
  const angle = document.getElementById("angle-filter").value;
  const valueFunc = {
    ascents: getTotalAscents,
    difficulty: getExtremeDifficulty,
    quality: getAverageQuality,
  }[sortCategory];
  climbList.sort(function (a, b) {
    if (sortCategory == "name") {
      return (
        a[1].toUpperCase().localeCompare(b[1].toUpperCase()) *
        (reverse ? -1 : 1)
      );
    } else {
      return (
        (valueFunc(a[0], angle, reverse) - valueFunc(b[0], angle, reverse)) *
        (reverse ? -1 : 1)
      );
    }
  });
}

document.getElementById("search-button").addEventListener("click", function () {
  const matchResults = document.getElementById("match-results");
  matchResults.innerHTML = "";
  const filteredClimbs = filterClimbs();
  sortClimbs(filteredClimbs);
  for (const climb of filteredClimbs) {
    let listButton = document.createElement("button");
    listButton.setAttribute("data-climb-uuid", climb[0]);
    listButton.setAttribute("class", "list-group-item list-group-item-action");
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
    listButton.appendChild(document.createTextNode(climb[1]));
    matchResults.appendChild(listButton);
  }
  if (filteredClimbs.length == 0) {
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

  for (const [difficulty, boulderName] of Object.entries(grades)) {
    let option = document.createElement("option");
    option.value = difficulty;
    option.text = boulderName;
    minGradeFilter.appendChild(option);
    maxGradeFilter.appendChild(option.cloneNode(true));
  }

  minGradeFilter.addEventListener("change", updateMaxOnMinChange);
  maxGradeFilter.addEventListener("change", updateMinOnMaxChange);
  setDefaultFilterOptions();
}

function getImageElement(imageDir, imageIndex) {
  const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
  image.setAttribute("href", `${imageDir}/${imageIndex}.png`);
  return image;
}

function updateProductSize(productSizeId) {
  const productData = products[productSizeId];
  const imageDir = `media/${productSizeId}`;
  const filterSvg = document.getElementById("filter-svg");
  filterSvg.innerHTML = "";
  filterSvg.appendChild(getImageElement(imageDir, 0));
  filterSvg.appendChild(getImageElement(imageDir, 1));
  const climbSvg = document.getElementById("climb-svg");
  climbSvg.innerHTML = "";
  climbSvg.appendChild(getImageElement(imageDir, 0));
  climbSvg.appendChild(getImageElement(imageDir, 1));

  const image = new Image();
  image.onload = function () {
    filterSvg.setAttribute("viewBox", `0 0 ${image.width} ${image.height}`);
    climbSvg.setAttribute("viewBox", `0 0 ${image.width} ${image.height}`);
    drawHoldCircles(image.width, image.height, productData);
  };
  image.src = `${imageDir}/0.png`;

  document.getElementById(
    "product-name"
  ).textContent = `Product Size: ${productData.name}`;

  productDimensions = {
    edgeLeft: productData.edge_left,
    edgeRight: productData.edge_right,
    edgeBottom: productData.edge_bottom,
    edgeTop: productData.edge_top,
  };

  resetFilter();
}

function populateProductSizes() {
  const productSizes = document.getElementById("product-sizes");
  for (const [productId, productData] of Object.entries(products)) {
    let listItem = document.createElement("li");
    listItem.setAttribute("class", "dropdown-item");
    listItem.setAttribute("data-product-size-id", productId);
    listItem.addEventListener("click", function (event) {
      updateProductSize(event.target.getAttribute("data-product-size-id"));
    });
    listItem.appendChild(document.createTextNode(productData.name));
    productSizes.appendChild(listItem);
  }
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
  document.getElementById("min-ascents-filter").value = 5;
}

document.getElementById("reset-button").addEventListener("click", resetFilter);

populateFilterOptions();
populateProductSizes();
updateProductSize(10);
