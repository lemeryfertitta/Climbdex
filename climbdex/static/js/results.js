const colorMap = colors.reduce((acc, colorRow) => {
  acc[colorRow[0]] = colorRow[1];
  return acc;
}, {});

function drawClimb(
  uuid,
  name,
  frames,
  setter,
  difficultyAngleSpan,
  description,
  attempts_infotext,
  difficulty
) {
  document
    .getElementById("svg-climb")
    .querySelectorAll('circle[stroke-opacity="1"]')
    .forEach((circle) => {
      circle.setAttribute("stroke-opacity", 0.0);
    });

  for (const frame of frames.split("p")) {
    if (frame.length > 0) {
      const [placementId, colorId] = frame.split("r");
      const circle = document.getElementById(`hold-${placementId}`);
      circle.setAttribute("stroke", colorMap[colorId]);
      circle.setAttribute("stroke-opacity", 1.0);
    }
  }

  const anchor = document.createElement("a");
  anchor.textContent = name;
  anchor.href = `${appUrl}/climbs/${uuid}`;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";

  /* SET the difficutly */

  const diffforSave = document.getElementById("difficulty");
  diffforSave.value = difficulty;
  const event = new Event("change");
  diffforSave.dispatchEvent(event);

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

  const climbedAttempts = document.getElementById("paragraph-climb-attempts");

  if (attempts_infotext === undefined) {
    climbedAttempts.classList.add("d-none");
  } else {
    climbedAttempts.classList.remove("d-none");
    climbedAttempts.innerHTML = `${attempts_infotext}`;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const board = urlParams.get("board");
  fetchBetaCount(board, uuid).then((betaCount) => {
    const betaCountSpan = document.getElementById("span-beta-count");
    betaCountSpan.textContent = betaCount;
  });

  const betaAnchor = document.getElementById("anchor-beta");
  betaAnchor.href = `/${board}/beta/${uuid}/`;

  document.getElementById("button-illuminate").onclick = function () {
    const bluetoothPacket = getBluetoothPacket(
      frames,
      placementPositions,
      ledColors
    );
    illuminateClimb(board, bluetoothPacket);
  };

  const modalclimbNameHeader = document.getElementById("modal-climb-name");
  modalclimbNameHeader.innerHTML = name;

  const modalclimbStatsParagraph = document.getElementById("modal-climb-stats");
  modalclimbStatsParagraph.innerHTML = difficultyAngleSpan.outerHTML;
}
function generateUUID() {
  let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
  return uuid.replace(/-/g, ""); // Remove the hyphens
}

document.getElementById("saveTick").addEventListener("click", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const board = urlParams.get("board");
  const angle = 35;
  const token = "0afcae08f1d596ff060cd613d7297d799d8faaf6"; // Add the token here
  const user_id = 63956; // Provide the user ID here
  const climb_uuid = "6FF2804AEC6541808C08B8E403F5703D"; // Provide the climb UUID here
  const is_mirror = false;
  const attempt_id = 1; // Versuche
  const bid_count = 1;
  const quality = 3; // rating sterne
  const difficulty = 15; // document.getElementById("difficulty").value;
  const is_benchmark = false;
  const climbed_at = new Date().toISOString().split("T")[0] + " 00:00:00";
  const comment = "Test eintrag"; //document.getElementById("comment").value;

  const rating = document.querySelector('input[name="rating"]:checked')?.value;
  const attemptType = document.querySelector(
    'input[name="attemptType"]:checked'
  )?.id;
  let attempts;
  if (attemptType === "flash") {
    attempts = "1";
  } else {
    attempts = document.getElementById("attempts").value;
  }

  // Generate UUID (you need to implement this function)
  const uuid = generateUUID();
  console.log(
    JSON.stringify({
      user_id: user_id,
      uuid: uuid,
      climb_uuid: climb_uuid,
      angle: angle,
      is_mirror: is_mirror,
      attempt_id: attempt_id,
      bid_count: bid_count,
      quality: quality,
      difficulty: difficulty,
      is_benchmark: is_benchmark,
      comment: comment,
      climbed_at: climbed_at,
    })
  );
  // Make the API request
  fetch(`https://api.tensionboardapp2.com/v1/ascents/${uuid}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: user_id,
      uuid: uuid,
      climb_uuid: climb_uuid,
      angle: angle,
      is_mirror: is_mirror,
      attempt_id: attempt_id,
      bid_count: bid_count,
      quality: quality,
      difficulty: difficulty,
      is_benchmark: is_benchmark,
      comment: comment,
      climbed_at: climbed_at,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      // Handle the response data
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

async function fetchBetaCount(board, uuid) {
  const response = await fetch(`/api/v1/${board}/beta/${uuid}`);
  const responseJson = await response.json();
  return responseJson.length;
}

async function fetchResultsCount() {
  const urlParams = new URLSearchParams(window.location.search);
  const response = await fetch("/api/v1/search/count?" + urlParams);
  const resultsCount = await response.json();

  if (resultsCount["error"] == true) {
    alert.querySelector(".alert-content").innerHTML =
      resultsCount["description"];
    alert.classList.add("show-alert");
  } else {
    return resultsCount;
  }
}

async function fetchResults(pageNumber, pageSize) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.append("page", pageNumber);
  urlParams.append("pageSize", pageSize);
  const response = await fetch("/api/v1/search?" + urlParams);
  const results = await response.json();

  if (results["error"] == true) {
    alert.querySelector(".alert-content").innerHTML =
      resultsCount["description"];
    alert.classList.add("show-alert");
  } else {
    return results;
  }
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
  path.setAttribute("d", "M 30,180 90,240 240,30");
  path.setAttribute("style", "stroke:#000; stroke-width:25; fill:none");
  return path;
}

function getTickSvg(tickType) {
  const tickSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  const tickSize = 16;
  const viewBoxSize = 280;
  const upwardShift = 30;

  const centerX = viewBoxSize / 2;
  tickSvg.setAttribute(
    "viewBox",
    `0 +${upwardShift} ${viewBoxSize} ${viewBoxSize - upwardShift}`
  );
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
      classic,
    ] = result;

    const classicSymbol = classic !== null ? "\u00A9" : "";
    const difficultyErrorPrefix = Number(difficultyError) > 0 ? "+" : "-";
    const difficultyErrorSuffix = String(
      Math.abs(difficultyError).toFixed(2)
    ).replace(/^0+/, "");
    const difficultyAngleText =
      difficulty && angle
        ? `${difficulty} (${difficultyErrorPrefix}${difficultyErrorSuffix}) at ${angle}\u00B0 ${classicSymbol}`
        : "";
    const difficultyAngleSpan = document.createElement("span");
    difficultyAngleSpan.appendChild(
      document.createTextNode(difficultyAngleText)
    );

    const show_attempts = attemptedClimbs[`${uuid}-${angle}`];
    let attempts_infotext;
    if (show_attempts !== undefined) {
      listButton.classList.add("bg-warning-subtle");
      attempts_infotext =
        "You had " +
        show_attempts["total_tries"] +
        (show_attempts["total_tries"] === 1 ? " try in " : " tries in ") +
        show_attempts["total_sessions"] +
        (show_attempts["total_sessions"] === 1
          ? " session. <br> The last session was "
          : " sessions. <br> The last session was ") +
        show_attempts["days_pass_since_last_try"] +
        " ago.";
    }

    const tickType = tickedClimbs[`${uuid}-${angle}`];
    if (tickType !== undefined) {
      listButton.classList.add("bg-success-subtle");
      listButton.classList.remove("bg-warning-subtle"); //remove class if a climb used to be a attemped but was ticked later
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
      drawClimb(
        uuid,
        name,
        frames,
        setter,
        difficultyAngleSpan,
        description,
        attempts_infotext,
        difficulty
      );
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
backAnchor.href = location.origin + "/filter" + location.search;
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
