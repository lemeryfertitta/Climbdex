function drawClimb(
  uuid,
  name,
  frames,
  setter,
  difficultyAngleSpan,
  description
) {
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

  document.getElementById("div-climb")?.scrollIntoView(true);

  const climbSetterHeader = document.getElementById("header-climb-setter");
  climbSetterHeader.textContent = `by ${setter}`;

  const climbStatsParagraph = document.getElementById("paragraph-climb-stats");
  climbStatsParagraph.innerHTML = difficultyAngleSpan.outerHTML;

  const climbDescriptionParagraph = document.getElementById(
    "paragraph-climb-description"
  );
  const trimmedDescription = description.trim();
  if (trimmedDescription === "") {
    climbDescriptionParagraph.classList.add("d-none");
  } else {
    climbDescriptionParagraph.classList.remove("d-none");
    climbDescriptionParagraph.innerHTML = `Description: ${trimmedDescription.italics()}`;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const board = urlParams.get("board");
  fetchBetaCount(board, uuid).then((betaCount) => {
    const betaCountSpan = document.getElementById("span-beta-count");
    betaCountSpan.textContent = betaCount;
  });

  const betaAnchor = document.getElementById("anchor-beta");
  betaAnchor.href = `/${board}/beta/${uuid}/`;
}

async function fetchBetaCount(board, uuid) {
  const response = await fetch(`/api/v1/${board}/beta/${uuid}`);
  const responseJson = await response.json();
  return responseJson.length;
}

async function fetchResultsCount() {
  const urlParams = new URLSearchParams(window.location.search);
  const response = await fetch("/api/v1/search/count?" + urlParams);
  const resultsCount = await response.json();
  return resultsCount;
}

async function fetchResults(pageNumber, pageSize) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.append("page", pageNumber);
  urlParams.append("pageSize", pageSize);
  const response = await fetch("/api/v1/search?" + urlParams);
  const results = await response.json();
  return results;
}

function clickClimbButton(index, pageSize, resultsCount) {
  const button = document.querySelector(`button[data-index="${index}"]`);
  if (button) {
    button.click();
  } else if (index > 0 && index < resultsCount - 1) {
    const nextPageNumber = Math.floor(index / pageSize);
    fetchResults(nextPageNumber, pageSize).then((results) => {
      drawResultsPage(results, nextPageNumber, pageSize, resultsCount);
      document.querySelector(`button[data-index="${index}"]`)?.click();
    });
  }
}

function getTickPath() {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M 30,180 90,240 240,30"
  );
  path.setAttribute("style", "stroke:#000; stroke-width:25; fill:none");
  return path;
}

function getTickSvg(tickType) {
  const tickSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  const tickSize = 16;
  const viewBoxSize = 280;
  const upwardShift = 30;

  const centerX = viewBoxSize / 2;
  tickSvg.setAttribute("viewBox", `0 +${upwardShift} ${viewBoxSize} ${viewBoxSize - upwardShift}`);
  tickSvg.setAttribute("height", `${tickSize}px`);
  tickSvg.setAttribute("width", `${tickSize}px`);

  const normalTick = 0;
  const mirrorTick = 1;
  const bothTick = 2;

  if (tickType === normalTick || tickType === bothTick) {
    const normalPath = getTickPath();
    tickSvg.appendChild(normalPath);
  }
  if (tickType === mirrorTick || tickType === bothTick) {
    const mirroredPath = getTickPath();
    mirroredPath.setAttribute(
      "transform",
      `translate(${centerX}, 0) scale(-1, 1) translate(-${centerX})`
    );
    tickSvg.appendChild(mirroredPath);
  }
  return tickSvg;
}

function drawResultsPage(results, pageNumber, pageSize, resultsCount) {
  const resultsList = document.getElementById("div-results-list");
  for (const [index, result] of results.entries()) {
    let listButton = document.createElement("button");
    listButton.setAttribute("class", "list-group-item list-group-item-action");
    listButton.setAttribute("data-index", pageNumber * pageSize + index);

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
      difficultyError,
    ] = result;

    const difficultyErrorPrefix = Number(difficultyError) > 0 ? "+" : "-";
    const difficultyErrorSuffix = String(
      Math.abs(difficultyError).toFixed(2)
    ).replace(/^0+/, "");
    const difficultyAngleText =
      difficulty && angle
        ? `${difficulty} (${difficultyErrorPrefix}${difficultyErrorSuffix}) at ${angle}\u00B0`
        : "";
    const difficultyAngleSpan = document.createElement("span");
    difficultyAngleSpan.appendChild(
      document.createTextNode(difficultyAngleText)
    );
    const tickType = tickedClimbs[`${uuid}-${angle}`];
    if (tickType !== undefined) {
      listButton.classList.add("bg-secondary-subtle");
      difficultyAngleSpan.appendChild(document.createTextNode(" "));
      difficultyAngleSpan.appendChild(getTickSvg(tickType));
    }
    listButton.addEventListener("click", function (event) {
      const index = Number(event.currentTarget.getAttribute("data-index"));
      const prevButton = document.getElementById("button-prev");
      prevButton.onclick = function () {
        clickClimbButton(index - 1, pageSize, resultsCount);
      };
      prevButton.disabled = index <= 0;
      const nextButton = document.getElementById("button-next");
      nextButton.disabled = index >= resultsCount - 1;
      nextButton.onclick = function () {
        clickClimbButton(index + 1, pageSize, resultsCount);
      };
      drawClimb(uuid, name, frames, setter, difficultyAngleSpan, description);
    });
    const nameText = document.createElement("p");
    nameText.innerHTML = `${name} ${difficultyAngleSpan.outerHTML}`;
    const statsText = document.createElement("p");
    statsText.textContent =
      ascents && rating ? `${ascents} ascents, ${rating.toFixed(2)}\u2605` : "";
    statsText.classList.add("fw-light");
    listButton.appendChild(nameText);
    listButton.appendChild(statsText);
    resultsList.appendChild(listButton);
  }
  resultsList.onscroll = function (event) {
    const { scrollHeight, scrollTop, clientHeight } = event.target;
    if (
      Math.abs(scrollHeight - clientHeight - scrollTop) < 1 &&
      pageNumber < resultsCount / pageSize - 1
    ) {
      fetchResults(pageNumber + 1, pageSize).then((results) => {
        drawResultsPage(results, pageNumber + 1, pageSize, resultsCount);
      });
    }
  };
}

const backAnchor = document.getElementById("anchor-back");
backAnchor.href = location.origin + "/filter?" + location.search;
if (document.referrer && new URL(document.referrer).origin == location.origin) {
  backAnchor.addEventListener("click", function (event) {
    event.preventDefault();
    history.back();
  });
}

fetchResultsCount().then((resultsCount) => {
  const resultsCountHeader = document.getElementById("header-results-count");
  resultsCountHeader.textContent = `Found ${resultsCount} matching climbs`;
  fetchResults(0, 10).then((results) => {
    drawResultsPage(results, 0, 10, resultsCount);
  });
});
