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
  document.getElementById("filter-svg").appendChild(circle);
}

function drawClimbCircle(id, x, y, radius) {
  let circle = getCircle(id, x, y, radius);
  document.getElementById("climb-svg").appendChild(circle);
}

function drawHoldCircles(holds, imageWidth, imageHeight, productData) {
  let xSpacing = imageWidth / (productData.edgeRight - productData.edgeLeft);
  let ySpacing = imageHeight / (productData.edgeTop - productData.edgeBottom);
  for (const [hold_id, coords] of Object.entries(holds)) {
    if (
      coords[0] < productData.edgeLeft ||
      coords[0] > productData.edgeRight ||
      coords[1] < productData.edgeBottom ||
      coords[1] > productData.edgeTop
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

  const climbStatsTable = document.getElementById("climb-stats-table");
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

  const climbRow = document.getElementById("climb-row");
  climbRow.hidden = false;

  document.getElementById("climb-stats-row").hidden = false;
  const climbName = climbData[0];
  const climbLink = document.createElement("a");
  climbLink.textContent = climbName;
  climbLink.href = `https://kilterboardapp.com/climbs/${climbUuid}`;
  climbLink.target = "_blank";
  climbLink.rel = "noopener noreferrer";
  const climbNameElement = document.getElementById("climb-name");
  climbNameElement.innerHTML = climbLink.outerHTML;
  climbNameElement.scrollIntoView(true);
}

function getActiveClimb() {
  const matchResults = document.getElementById("match-results");
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
    document.getElementById("climb-name").textContent = "";
    document.getElementById("climb-stats-table").innerHTML = "";
  }
}

function getFilteredHoldCircles() {
  const filterSvg = document.getElementById("filter-svg");
  return filterSvg.querySelectorAll("circle[stroke-opacity='1']");
}

function resetFilter() {
  eraseActiveClimb();
  for (const circle of getFilteredHoldCircles()) {
    circle.setAttribute("stroke-opacity", 0.0);
    circle.setAttribute("stroke", "black");
  }
  document.getElementById("match-results").innerHTML = "";
  fetchGrades().then((grades) => {
    setDefaultFilterOptions(grades);
  });
  document.getElementById("climb-stats-row").hidden = true;
  document.getElementById("climb-row").hidden = true;
  document.getElementById("results-pages").hidden = true;
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
        (valueFunc(climbStats[a[0]], angle, reverse) -
          valueFunc(climbStats[b[0]], angle, reverse)) *
        (reverse ? -1 : 1)
      );
    }
  });
}

function getActiveProductSizeId() {
  return document
    .getElementById("product-name")
    .getAttribute("data-product-size-id");
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
  const matchResults = document.getElementById("match-results");
  const matchResultsPage = document.getElementById("match-results-page");
  matchResults.appendChild(matchResultsPage);
  matchResultsPage.innerHTML = "";
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
    matchResultsPage.appendChild(listButton);

    const numPages = Math.ceil(results.length / resultsPerPage);
    document.getElementById("page-number").textContent = `${
      pageNumber + 1
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
    document.getElementById("results-pages").hidden = false;
  }
}

document.getElementById("search-button").addEventListener("click", function () {
  const resultsPerPage = 10;
  fetchClimbs().then((climbs) => {
    fetchClimbStats().then((climbStats) => {
      fetchGrades().then((grades) => {
        fetchProducts().then((products) => {
          const matchResults = document.getElementById("match-results");
          matchResults.innerHTML = "";
          const matchResultsPage = document.createElement("div");
          matchResultsPage.id = "match-results-page";
          matchResults.appendChild(matchResultsPage);
          const filteredClimbs = filterClimbs(
            climbs,
            climbStats,
            products[getActiveProductSizeId()]
          );
          const angleFilter = document.getElementById("angle-filter").value;
          let filterListElement = document.createElement("h6");
          filterListElement.textContent = `Filters: ${
            getFilteredHoldCircles().length
          } holds, ${
            angleFilter == "Any" ? "any angle" : angleFilter + "\xB0"
          }, between ${
            grades[document.getElementById("min-grade-filter").value]
          } and ${grades[document.getElementById("max-grade-filter").value]}, ${
            document.getElementById("min-ascents-filter").value
          }+ ascents, and ${
            document.getElementById("min-quality-filter").value
          }+ stars.`;
          matchResults.appendChild(filterListElement);
          let matchCountElement = document.createElement("h5");
          matchCountElement.textContent = `Found ${filteredClimbs.length} climbs matching filters`;
          matchResults.appendChild(matchCountElement);
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

function populateFilterOptions(angles, grades) {
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
}

function getImageElement(imageDir, imageIndex) {
  const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
  image.setAttribute("href", `${imageDir}/${imageIndex}.png`);
  return image;
}

function updateProductSize(products, holds, productSizeId) {
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
    drawHoldCircles(holds, image.width, image.height, productData);
  };
  image.src = `${imageDir}/0.png`;

  const productName = document.getElementById("product-name");
  productName.setAttribute("data-product-size-id", productSizeId);
  productName.textContent = `Product Size: ${productData.name}`;

  resetFilter();
}

function populateProductSizes(products, holds) {
  const productSizes = document.getElementById("product-sizes");
  for (const [productId, productData] of Object.entries(products)) {
    let listItem = document.createElement("li");
    listItem.setAttribute("class", "dropdown-item");
    listItem.setAttribute("data-product-size-id", productId);
    listItem.addEventListener("click", function (event) {
      updateProductSize(
        products,
        holds,
        event.target.getAttribute("data-product-size-id")
      );
    });
    listItem.appendChild(document.createTextNode(productData.name));
    productSizes.appendChild(listItem);
  }
}

function setDefaultFilterOptions(grades) {
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

document
  .getElementById("hold-filter-button")
  .addEventListener("click", function (event) {
    const holdFilter = document.getElementById("filter-row");
    holdFilter.hidden = !holdFilter.hidden;
    event.target.textContent = `${
      holdFilter.hidden ? "Show" : "Hide"
    } Hold Filter`;
  });
document.getElementById("reset-button").addEventListener("click", resetFilter);

// Load data and populate UI. Data which does not affect the UI is loaded last
fetchAngles().then((angles) => {
  fetchGrades().then((grades) => {
    populateFilterOptions(angles, grades);
    setDefaultFilterOptions(grades);
    fetchProducts().then((products) => {
      fetchHolds().then((holds) => {
        populateProductSizes(products, holds);
        updateProductSize(products, holds, 10);
        fetchClimbs().then();
        fetchClimbStats().then();
      });
    });
  });
});
