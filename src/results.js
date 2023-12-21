function drawClimb(uuid, name, frames, colors) {
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
      circle.setAttribute("stroke", colors[colorId]);
      circle.setAttribute("stroke-opacity", 1.0);
    }
  }

  const anchor = document.createElement("a");
  anchor.textContent = name;
  anchor.href = `https://kilterboardapp.com/climbs/${uuid}`;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";

  const climbNameHeader = document.getElementById("header-climb-name");
  climbNameHeader.innerHTML = anchor.outerHTML;
}

function drawResultsPage(pageNumber, resultsPerPage, results, colors) {
  const startIndex = pageNumber * resultsPerPage;
  const resultsList = document.getElementById("div-results-list");
  resultsList.innerHTML = "";
  for (
    let resultIndex = startIndex;
    resultIndex < startIndex + resultsPerPage && resultIndex < results.length;
    resultIndex++
  ) {
    let listButton = document.createElement("button");
    listButton.setAttribute("class", "list-group-item list-group-item-action");

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
    ] = results[resultIndex];

    listButton.addEventListener("click", function (event) {
      drawClimb(uuid, name, frames, colors);
    });
    const nameText = document.createElement("p");
    nameText.textContent = `${name} (${difficulty} at ${angle}\u00B0)`;
    const statsText = document.createElement("p");
    statsText.textContent = `${ascents} ascents, ${rating.toFixed(2)}\u2605`;
    statsText.classList.add("fw-light");
    listButton.appendChild(nameText);
    listButton.appendChild(statsText);
    resultsList.appendChild(listButton);
  }

  const numPages = Math.ceil(results.length / resultsPerPage);
  document.getElementById("page-number").textContent = `${
    numPages == 0 ? 0 : pageNumber + 1
  } of ${numPages}`;
  const drawFunc = function (pageNumber) {
    return function () {
      drawResultsPage(pageNumber, resultsPerPage, results, colors);
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

function search(db, params) {
  let sql = `
  SELECT 
    climbs.uuid,
    climbs.setter_username,
    climbs.name,
    climbs.description,
    climbs.frames,
    climb_stats.angle,
    climb_stats.ascensionist_count,
    (SELECT boulder_name FROM difficulty_grades WHERE difficulty = ROUND(climb_stats.display_difficulty)) AS difficulty,
    climb_stats.quality_average
  FROM climbs
  LEFT JOIN climb_stats
  ON climb_stats.climb_uuid = climbs.uuid
  
  INNER JOIN product_sizes
  ON product_sizes.id = ${params.get("size")}

  -- BASIC FILTERS:
  WHERE climbs.frames_count = 1
  AND climbs.is_draft = 0
  AND climbs.is_listed = 1

  -- LAYOUT
  AND climbs.layout_id = ${params.get("layout")}

  -- PRODUCT SIZE:
  AND climbs.edge_left >= product_sizes.edge_left
  AND climbs.edge_right <= product_sizes.edge_right
  AND climbs.edge_bottom >= product_sizes.edge_bottom
  AND climbs.edge_top <= product_sizes.edge_top

  -- ASCENTS:
  AND climb_stats.ascensionist_count >= ${params.get("minAscents")}

  -- GRADES:
  AND climb_stats.display_difficulty BETWEEN ${params.get(
    "minGrade"
  )} AND ${params.get("maxGrade")}

  -- RATING:
  AND climb_stats.quality_average >= ${params.get("minRating")}
  `;
  const angle = params.get("angle");
  if (angle && angle != "any") {
    sql += ` AND climb_stats.angle = ${angle}`;
  }

  const holds = params.get("holds");
  if (holds) {
    const likeString = holds
      .split("p")
      .filter((holdString) => {
        holdString.length > 0;
      })
      .map((holdString) => {
        `p${holdString}`;
      })
      .sort()
      .join("%");
    sql += ` AND climbs.frames LIKE '%${likeString}%'`;
  }

  const orderBySqlName = {
    ascents: "climb_stats.ascensionist_count",
    grade: "climb_stats.display_difficulty",
    name: "climbs.name",
    rating: "climb_stats.quality_average",
  }[params.get("sortBy")];

  sql += ` ORDER BY ${orderBySqlName} ${params.get("sortOrder")}`;
  return db.exec(sql);
}

const resultsPerPage = 10;
const params = new URLSearchParams(window.location.search);
getDatabase("data/tension/db.sqlite3.gz").then((db) => {
  drawBoard(
    document.getElementById("svg-climb"),
    db,
    params.get("layout"),
    params.get("size"),
    params.getAll("set")
  );

  const results = search(db, params);
  if (results) {
    climbs = results[0].values;
    let resultsCountHeader = document.getElementById("header-results-count");
    resultsCountHeader.textContent = `Found ${climbs.length} matching climbs`;
    const colors = getColors(db, params.get("layout"));
    drawResultsPage(0, resultsPerPage, climbs, colors);
  }
});
