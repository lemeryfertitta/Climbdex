function drawClimb(uuid, name, frames, setter, difficultyAngleText) {
  document
    .getElementById("svg-climb")
    .querySelectorAll('circle[stroke-opacity="1"]')
    .forEach((circle) => {
      circle.setAttribute("stroke-opacity", 0.0);
    });

  const colorIdsToColor = {};
  for (const [colorId, color] of colors) {
    colorIdsToColor[colorId] = color;
  }

  for (const frame of frames.split("p")) {
    if (frame.length > 0) {
      const [placementId, colorId] = frame.split("r");
      const circle = document.getElementById(`hold-${placementId}`);
      circle.setAttribute("stroke", colorIdsToColor[colorId]);
      circle.setAttribute("stroke-opacity", 1.0);
    }
  }

  const anchor = document.createElement("a");
  anchor.textContent = name;
  anchor.href = `${appUrl}/climbs/${uuid}`;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";

  const climbNameHeader = document.getElementById("header-climb-name");
  climbNameHeader.innerHTML = "";
  climbNameHeader.appendChild(anchor);

  const climbSetterHeader = document.getElementById("header-climb-setter");
  climbSetterHeader.textContent = `by ${setter}`;

  const climbStatsParagraph = document.getElementById("paragraph-climb-stats");
  climbStatsParagraph.textContent = difficultyAngleText;
}

async function getResultsCount() {
  const urlParams = new URLSearchParams(window.location.search);
  const response = await fetch("/api/v1/search/count?" + urlParams);
  const resultsCount = await response.json();
  return resultsCount;
}

async function getResults(pageNumber, pageSize) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.append("page", pageNumber);
  urlParams.append("pageSize", pageSize);
  const response = await fetch("/api/v1/search?" + urlParams);
  const results = await response.json();
  return results;
}

function drawResultsCount() {
  getResultsCount().then((resultsCount) => {
    const resultsCountHeader = document.getElementById("header-results-count");
    resultsCountHeader.textContent = `Found ${resultsCount} matching climbs`;
  });
}

function drawResultsPage(pageNumber, pageSize) {
  getResults(pageNumber, pageSize).then((results) => {
    const resultsList = document.getElementById("div-results-list");
    for (const result of results) {
      let listButton = document.createElement("button");
      listButton.setAttribute(
        "class",
        "list-group-item list-group-item-action"
      );

      const [
        uuid,
        setter,
        name,
        description,
        frames,
        angle,
        ascents,
        difficulty,
        rating,
      ] = result;

      const difficultyAngleText = `${difficulty} at ${angle}\u00B0`;
      listButton.addEventListener("click", function () {
        drawClimb(uuid, name, frames, setter, difficultyAngleText);
      });
      const nameText = document.createElement("p");
      nameText.textContent = `${name} (${difficultyAngleText})`;
      const statsText = document.createElement("p");
      statsText.textContent = `${ascents} ascents, ${rating.toFixed(2)}\u2605`;
      statsText.classList.add("fw-light");
      listButton.appendChild(nameText);
      listButton.appendChild(statsText);
      resultsList.appendChild(listButton);
    }
    resultsList.onscroll = function (event) {
      const { scrollHeight, scrollTop, clientHeight } = event.target;
      if (Math.abs(scrollHeight - clientHeight - scrollTop) < 1) {
        drawResultsPage(pageNumber + 1, pageSize);
      }
    };
  });
}

drawResultsCount();
drawResultsPage(0, 10);
