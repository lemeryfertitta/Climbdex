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

function getData(dataName) {
  let cachedJson = {};
  return async function () {
    if (cachedJson[dataName] == undefined) {
      const response = await fetch(`data/${dataName}.json.gz`);
      const decodedStream = response.body
        .pipeThrough(new DecompressionStream("gzip"))
        .pipeThrough(new TextDecoderStream());
      const reader = decodedStream.getReader();
      let jsonString = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        } else {
          jsonString += value;
        }
      }
      cachedJson[dataName] = JSON.parse(jsonString);
    }
    return cachedJson[dataName];
  };
}

const fetchAngles = getData("angles");
const fetchClimbs = getData("climbs");
const fetchClimbStats = getData("climbStats");
const fetchGrades = getData("grades");
const fetchHolds = getData("holds");
const fetchProducts = getData("products");

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
    if (nextIndex >= colors.length) {
      event.target.setAttribute("stroke-opacity", 0.0);
      event.target.setAttribute("stroke", "black");
    } else {
      event.target.setAttribute("stroke", colors[nextIndex]);
      event.target.setAttribute("stroke-opacity", 1.0);
    }
  };
  document.getElementById("svg-hold-filter").appendChild(circle);
}

function drawClimbCircle(id, x, y, radius) {
  let circle = getCircle(id, x, y, radius);
  document.getElementById("svg-climb").appendChild(circle);
}

function drawHoldCircles(holds, imageWidth, imageHeight, productData) {
  let xSpacing = imageWidth / (productData.edgeRight - productData.edgeLeft);
  let ySpacing = imageHeight / (productData.edgeTop - productData.edgeBottom);
  for (const [hold_id, coords] of Object.entries(holds)) {
    if (
      coords[0] <= productData.edgeLeft ||
      coords[0] >= productData.edgeRight ||
      coords[1] <= productData.edgeBottom ||
      coords[1] >= productData.edgeTop
    ) {
      continue;
    }
    let x = (coords[0] - productData.edgeLeft) * xSpacing;
    let y = imageHeight - (coords[1] - productData.edgeBottom) * ySpacing;
    drawFilterCircle(`filter-${hold_id}`, x, y, xSpacing * 4);
    drawClimbCircle(`climb-${hold_id}`, x, y, xSpacing * 4);
  }
}

function drawClimb(climbUuid, climbData, climbAngles, grades) {
  const climbString = climbData[1];
  const holdStrings = climbString.split("p");
  for (const holdString of holdStrings) {
    if (holdString.length > 0) {
      const [holdId, color_string] = holdString.split("r");
      const color = stringToColors[color_string];
      const circle = document.getElementById(`climb-${holdId}`);
      circle.setAttribute("stroke", color);
      circle.setAttribute("stroke-opacity", 1.0);
    }
  }

  const climbStatsTable = document.getElementById("tbody-climb-stats");
  climbStatsTable.innerHTML = "";
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

  document.getElementById("svg-climb").classList.replace("d-none", "d-flex");
  document
    .getElementById("div-climb-stats")
    .classList.replace("d-none", "d-flex");
  const climbName = climbData[0];
  const climbLink = document.createElement("a");
  climbLink.textContent = climbName;
  climbLink.href = `https://kilterboardapp.com/climbs/${climbUuid}`;
  climbLink.target = "_blank";
  climbLink.rel = "noopener noreferrer";
  const climbNameHeader = document.getElementById("header-climb-name");
  climbNameHeader.innerHTML = climbLink.outerHTML;
  climbNameHeader.scrollIntoView(true);
}

function getActiveClimb() {
  const matchResults = document.getElementById("div-results-list");
  return matchResults.getElementsByClassName("active")[0];
}

function eraseActiveClimb() {
  const activeClimb = getActiveClimb();
  if (activeClimb) {
    fetchClimbs().then((climbs) => {
      const climbUuid = activeClimb.getAttribute("data-climb-uuid");
      const climbData = climbs[climbUuid];
      const climbString = climbData[1];
      const holdStrings = climbString.split("p");
      for (const holdString of holdStrings) {
        if (holdString.length > 0) {
          const holdId = holdString.split("r")[0];
          const circle = document.getElementById(`climb-${holdId}`);
          if (circle != null) {
            circle.setAttribute("stroke-opacity", 0.0);
          }
        }
      }
    });
  }
  document.getElementById("header-climb-name").textContent = "";
  document.getElementById("tbody-climb-stats").innerHTML = "";
}

function getFilteredHoldCircles() {
  const filterSvg = document.getElementById("svg-hold-filter");
  return filterSvg.querySelectorAll("circle[stroke-opacity='1']");
}

function matchesFilters(
  climbAngles,
  angle,
  minGrade,
  maxGrade,
  minAscents,
  minQuality
) {
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

function fitsProductSize(product, climbData) {
  return (
    climbData[2] >= product.edgeLeft &&
    climbData[3] <= product.edgeRight &&
    climbData[4] >= product.edgeBottom &&
    climbData[5] <= product.edgeTop
  );
}

function filterClimbs(climbs, climbStats, product) {
  let subStrings = [];
  for (const cirlce of getFilteredHoldCircles()) {
    const holdId = cirlce.getAttribute("id").split("-")[1];
    const color = cirlce.getAttribute("stroke");
    subStrings.push("p" + holdId + "r" + colorsToString[color]);
  }
  subStrings.sort();
  let regexp = new RegExp(subStrings.join(".*"));
  const angle = document.getElementById("select-angle").value;
  const minGrade = document.getElementById("select-min-grade").value;
  const maxGrade = document.getElementById("select-max-grade").value;
  const minAscents = document.getElementById("input-min-ascents").value;
  const minQuality = document.getElementById("input-min-rating").value;
  const filteredClimbs = [];
  for (const [climbUuid, climbData] of Object.entries(climbs)) {
    climb_string = climbData[1];
    if (
      climb_string.match(regexp) &&
      fitsProductSize(product, climbData) &&
      matchesFilters(
        climbStats[climbUuid],
        angle,
        minGrade,
        maxGrade,
        minAscents,
        minQuality
      )
    ) {
      filteredClimbs.push([climbUuid].concat(climbData));
    }
  }
  return filteredClimbs;
}

function getTotalAscents(climbAngles, angle) {
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

function getAverageQuality(climbAngles, angle) {
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

function getExtremeDifficulty(climbAngles, angle, isMax) {
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

function sortClimbs(climbList, climbStats) {
  const sortBy = document.getElementById("select-sort-by").value;
  const reverse = document.getElementById("select-sort-order").value == "desc";
  const angle = document.getElementById("select-angle").value;
  const valueFunc = {
    ascents: getTotalAscents,
    difficulty: getExtremeDifficulty,
    quality: getAverageQuality,
  }[sortBy];
  climbList.sort(function (a, b) {
    if (sortBy == "name") {
      return (
        a[1].toUpperCase().localeCompare(b[1].toUpperCase()) *
        (reverse ? -1 : 1)
      );
    } else {
      return (
        (valueFunc(climbStats[a[0]], angle, reverse) -
          valueFunc(climbStats[b[0]], angle, reverse)) *
        (reverse ? -1 : 1)
      );
    }
  });
}

function getFilters() {
  return {
    angle: document.getElementById("select-angle"),
    board: document.getElementById("select-board"),
    holds: getFilteredHoldCircles(),
    maxGrade: document.getElementById("select-max-grade"),
    minGrade: document.getElementById("select-min-grade"),
    minAscents: document.getElementById("input-min-ascents"),
    minRating: document.getElementById("input-min-rating"),
    sortBy: document.getElementById("select-sort-by"),
    sortOrder: document.getElementById("select-sort-order"),
  };
}

function drawResultsPage(
  pageNumber,
  resultsPerPage,
  results,
  climbs,
  climbStats,
  grades
) {
  const startIndex = pageNumber * resultsPerPage;
  const resultsList = document.getElementById("div-results-list");
  const resultsListPage = document.getElementById("div-results-list-page");
  resultsList.appendChild(resultsListPage);
  resultsListPage.innerHTML = "";
  for (
    let resultIndex = startIndex;
    resultIndex < startIndex + resultsPerPage && resultIndex < results.length;
    resultIndex++
  ) {
    const climb = results[resultIndex];
    let listButton = document.createElement("button");
    listButton.setAttribute("data-climb-uuid", climb[0]);
    listButton.setAttribute("class", "list-group-item list-group-item-action");
    listButton.addEventListener("click", function (event) {
      const currentClimb = getActiveClimb();
      if (currentClimb) {
        if (currentClimb == event.target) {
          return;
        }
        eraseActiveClimb();
        currentClimb.classList.remove("active");
      }
      event.target.setAttribute(
        "class",
        "list-group-item list-group-item-action active"
      );
      const climbUuid = event.target.getAttribute("data-climb-uuid");
      drawClimb(climbUuid, climbs[climbUuid], climbStats[climbUuid], grades);
    });
    listButton.appendChild(document.createTextNode(climb[1]));
    resultsListPage.appendChild(listButton);
  }

  const numPages = Math.ceil(results.length / resultsPerPage);
  document.getElementById("page-number").textContent = `${
    numPages == 0 ? 0 : pageNumber + 1
  } of ${numPages}`;
  const drawFunc = function (pageNumber) {
    return function () {
      drawResultsPage(
        pageNumber,
        resultsPerPage,
        results,
        climbs,
        climbStats,
        grades
      );
    };
  };
  document.getElementById("first-page").onclick = drawFunc(0);
  document.getElementById("prev-page").onclick = drawFunc(
    Math.max(0, pageNumber - 1)
  );
  document.getElementById("next-page").onclick = drawFunc(
    Math.min(pageNumber + 1, numPages - 1)
  );
  document.getElementById("last-page").onclick = drawFunc(numPages - 1);
  document
    .getElementById("div-results-pagination")
    .classList.replace("d-none", "d-inline-block");
}

document
  .getElementById("form-search")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const resultsPerPage = 10;
    fetchClimbs().then((climbs) => {
      fetchClimbStats().then((climbStats) => {
        fetchGrades().then((grades) => {
          fetchProducts().then((products) => {
            const matchResults = document.getElementById("div-results-list");
            matchResults.innerHTML = "";
            const matchResultsPage = document.createElement("div");
            matchResultsPage.id = "div-results-list-page";
            matchResults.appendChild(matchResultsPage);
            const productSizeId = document.getElementById("select-board");
            const filteredClimbs = filterClimbs(
              climbs,
              climbStats,
              products[productSizeId.value]
            );
            const angleFilter = document.getElementById("select-angle").value;
            let matchCountElement = document.createElement("h5");
            matchCountElement.textContent = `Found ${filteredClimbs.length} matching climbs`;
            matchResults.appendChild(matchCountElement);

            let filterListElement = document.createElement("p");
            let filters = getFilters();
            filterListElement.textContent = `Showing problems with ${
              filters.holds.length
            } selected hold(s), at ${filters.angle.options[
              filters.angle.selectedIndex
            ].text.toLowerCase()} degrees, between ${
              filters.minGrade.options[filters.minGrade.selectedIndex].text
            } and ${
              filters.maxGrade.options[filters.maxGrade.selectedIndex].text
            }, with at least ${
              filters.minAscents.value
            } ascents and an average rating of ${
              filters.minRating.value
            } star(s) or more, sorted by ${filters.sortBy.options[
              filters.sortBy.selectedIndex
            ].text.toLowerCase()}, ${filters.sortOrder.options[
              filters.sortOrder.selectedIndex
            ].text.toLowerCase()}.`;
            matchResults.appendChild(filterListElement);

            sortClimbs(filteredClimbs, climbStats);
            drawResultsPage(
              0,
              resultsPerPage,
              filteredClimbs,
              climbs,
              climbStats,
              grades
            );
            matchResults.scrollIntoView(true);
          });
        });
      });
    });
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

function populateFilters(angles, grades, holds, products) {
  const boardSelect = document.getElementById("select-board");
  for (const [productId, productData] of Object.entries(products)) {
    let option = document.createElement("option");
    option.text = productData.name;
    option.value = productId;
    option.addEventListener("change", function (event) {
      updateProductSize(products, holds, event.target.value);
    });
    boardSelect.appendChild(option);
  }
  boardSelect.addEventListener("change", function (event) {
    updateProductSize(holds, products, event.target.value);
  });

  const angleSelect = document.getElementById("select-angle");
  for (const angle of angles) {
    let option = document.createElement("option");
    option.value = angle;
    option.text = angle;
    angleSelect.appendChild(option);
  }

  const minGradeSelect = document.getElementById("select-min-grade");
  const maxGradeSelect = document.getElementById("select-max-grade");

  for (const [difficulty, boulderName] of Object.entries(grades)) {
    let option = document.createElement("option");
    option.value = difficulty;
    option.text = boulderName;
    minGradeSelect.appendChild(option);
    maxGradeSelect.appendChild(option.cloneNode(true));
  }

  minGradeSelect.addEventListener("change", updateMaxOnMinChange);
  maxGradeSelect.addEventListener("change", updateMinOnMaxChange);
}

function getImageElement(imageDir, imageIndex) {
  const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
  image.setAttribute("href", `${imageDir}/${imageIndex}.png`);
  return image;
}

function updateProductSize(holds, products, productSizeId) {
  const productData = products[productSizeId];
  const imageDir = `media/${productSizeId}`;
  const holdFilterSvg = document.getElementById("svg-hold-filter");
  holdFilterSvg.innerHTML = "";
  holdFilterSvg.appendChild(getImageElement(imageDir, 0));
  holdFilterSvg.appendChild(getImageElement(imageDir, 1));
  const climbSvg = document.getElementById("svg-climb");
  climbSvg.innerHTML = "";
  climbSvg.appendChild(getImageElement(imageDir, 0));
  climbSvg.appendChild(getImageElement(imageDir, 1));

  const image = new Image();
  image.onload = function () {
    holdFilterSvg.setAttribute("viewBox", `0 0 ${image.width} ${image.height}`);
    climbSvg.setAttribute("viewBox", `0 0 ${image.width} ${image.height}`);
    drawHoldCircles(holds, image.width, image.height, productData);
  };
  image.src = `${imageDir}/0.png`;
}

function setFilterDefaults(grades, holds, products) {
  const boardSelect = document.getElementById("select-board");
  boardSelect.value = "10";
  updateProductSize(holds, products, "10");

  const angleSelect = document.getElementById("select-angle");
  angleSelect.value = "Any";

  const gradeNumbers = Object.keys(grades).map(Number);
  gradeNumbers.sort();

  const minGradeSelect = document.getElementById("select-min-grade");
  minGradeSelect.value = gradeNumbers[0];

  const maxGradeSelect = document.getElementById("select-max-grade");
  maxGradeSelect.value = gradeNumbers[gradeNumbers.length - 1];
}

document
  .getElementById("div-hold-filter")
  .addEventListener("shown.bs.collapse", function (event) {
    event.target.scrollIntoView(true);
  });

// Load data and populate UI. Data which does not affect the UI is loaded last
fetchAngles().then((angles) => {
  fetchGrades().then((grades) => {
    fetchProducts().then((products) => {
      fetchHolds().then((holds) => {
        populateFilters(angles, grades, holds, products);
        setFilterDefaults(grades, holds, products);
        fetchClimbs().then();
        fetchClimbStats().then();
      });
    });
  });
});
