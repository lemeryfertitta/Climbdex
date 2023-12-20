function getActiveClimb() {
  const matchResults = document.getElementById("div-results-list");
  return matchResults.getElementsByClassName("active")[0];
}

function eraseActiveClimb(climbs) {
  const activeClimb = getActiveClimb();
  if (activeClimb) {
    const climbUuid = activeClimb.getAttribute("data-climb-uuid");
    const climbData = climbs[climbUuid];
    const climbString = climbData[1];
    const holdStrings = climbString.split("p");
    for (const holdString of holdStrings) {
      if (holdString.length > 0) {
        const holdId = holdString.split("r")[0];
        const circle = document.getElementById(`hold-${holdId}`);
        if (circle != null) {
          circle.setAttribute("stroke-opacity", 0.0);
        }
      }
    }
  }
}

function drawClimb(climbUuid, climbData, climbAngles, grades) {
  const climbString = climbData[1];
  const holdStrings = climbString.split("p");
  for (const holdString of holdStrings) {
    if (holdString.length > 0) {
      const [holdId, color_string] = holdString.split("r");
      const color = stringToColors[color_string];
      const circle = document.getElementById(`hold-${holdId}`);
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
  resultsList.innerHTML = "";
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
        eraseActiveClimb(climbs);
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
    resultsList.appendChild(listButton);
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
}

function matchesFilters(climbAngles, params) {
  if (climbAngles == undefined) {
    return params.get("angle") == "any" && params.get("minAscents") == 0;
  } else if (params.get("angle") == "any") {
    for (const angleData of Object.values(climbAngles)) {
      if (
        angleData[0] >= params.get("minGrade") &&
        angleData[0] <= params.get("maxGrade") &&
        angleData[1] >= params.get("minAscents") &&
        angleData[2] >= params.get("minQuality")
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
      angleData[0] >= params.get("minGrade") &&
      angleData[0] <= params.get("maxGrade") &&
      angleData[1] >= params.get("minAscents") &&
      angleData[2] >= params.get("minQuality")
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

function filterClimbs(params, climbs, climbStats, product) {
  let holdStrings = [];
  for (const holdString of params.get("holds").split("p")) {
    if (holdString.length > 0) {
      holdStrings.push(`p${holdString}`);
    }
  }
  holdStrings.sort();
  let regexp = new RegExp(holdStrings.join(".*"));
  const filteredClimbs = [];
  for (const [climbUuid, climbData] of Object.entries(climbs)) {
    climb_string = climbData[1];
    if (
      climb_string.match(regexp) &&
      fitsProductSize(product, climbData) &&
      matchesFilters(climbStats[climbUuid], params)
    ) {
      filteredClimbs.push([climbUuid].concat(climbData));
    }
  }
  return filteredClimbs;
}

function getTotalAscents(climbAngles, angle) {
  if (climbAngles == undefined) {
    return 0;
  } else if (angle == "any") {
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
  } else if (angle == "any") {
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
  } else if (angle == "any") {
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

function sortClimbs(climbList, climbStats, params) {
  const sortBy = params.get("sortBy");
  const reverse = params.get("sortOrder") == "desc";
  const angle = params.get("angle");
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

const resultsPerPage = 10;
const params = new URLSearchParams(window.location.search);
console.log(params.get);
getDatabase("kilter").then((db) => {
  drawBoard(
    document.getElementById("svg-climb"),
    db,
    params.get("layout"),
    params.get("size"),
    params.getAll("set")
  );
});

// getData("products")().then((products) => {
//   getData("holds")().then((holds) => {
//     drawBoard(products, holds, params.get("board"));
//     getData("climbs")().then((climbs) => {
//       getData("climbStats")().then((climbStats) => {
//         getData("grades")().then((grades) => {
//           const filteredClimbs = filterClimbs(
//             params,
//             climbs,
//             climbStats,
//             products[params.get("board")]
//           );
//           let resultsCountHeader = document.getElementById(
//             "header-results-count"
//           );
//           resultsCountHeader.textContent = `Found ${filteredClimbs.length} matching climbs`;

//           let filtersParagraph = document.getElementById("paragraph-filters");
//           filtersParagraph.textContent = `Showing problems with ${
//             params.get("holds").split("p").length - 1
//           } selected hold(s), at ${params.get("angle")} degrees, between ${
//             grades[params.get("minGrade")]
//           } and ${grades[params.get("maxGrade")]}, with at least ${params.get(
//             "minAscents"
//           )} ascents and an average rating of ${params.get(
//             "minRating"
//           )} star(s) or more, sorted by ${params.get("sortBy")}, ${params.get(
//             "sortOrder"
//           )}.`;

//           sortClimbs(filteredClimbs, climbStats, params);
//           drawResultsPage(
//             0,
//             resultsPerPage,
//             filteredClimbs,
//             climbs,
//             climbStats,
//             grades
//           );
//           if (filteredClimbs.length > 0) {
//             drawClimb(
//               filteredClimbs[0][0],
//               climbs[filteredClimbs[0][0]],
//               climbStats[filteredClimbs[0][0]],
//               grades
//             );
//             const matchResults = document.getElementById("div-results-list");
//             matchResults.children[0].classList.add("active");
//           }
//         });
//       });
//     });
//   });
// });
