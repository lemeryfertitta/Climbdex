const ANGLES_SQL = `
SELECT
  angle
FROM products_angles
JOIN layouts
ON layouts.product_id = products_angles.product_id
WHERE layouts.id = $layoutId
`;

const GRADES_SQL = `
SELECT
  difficulty,
  boulder_name
FROM difficulty_grades
WHERE is_listed = 1
ORDER BY difficulty ASC
`;

const HOLDS_SQL = `
SELECT 
  placements.id,
  holes.x,
  holes.y
FROM placements
INNER JOIN holes
ON placements.hole_id=holes.id
WHERE placements.layout_id = $layoutId
AND placements.set_id = $setId
`;

const PRODUCT_SIZES_SQL = `
SELECT
  edge_left,
  edge_right,
  edge_bottom,
  edge_top
FROM product_sizes
WHERE id = $productSizeId
`;

function onFilterCircleClick(event) {
  const holdId = event.target.id.split("-")[1];
  const currentColor = event.target.getAttribute("stroke");
  let currentIndex = colors.indexOf(currentColor);
  let nextIndex = currentIndex + 1;
  const holdFilterInput = document.getElementById("input-hold-filter");
  if (nextIndex >= colors.length) {
    event.target.setAttribute("stroke-opacity", 0.0);
    event.target.setAttribute("stroke", "black");
    holdFilterInput.value = holdFilterInput.value.replace(
      `p${holdId}r${colorsToString[currentColor]}`,
      ""
    );
  } else {
    event.target.setAttribute("stroke", colors[nextIndex]);
    event.target.setAttribute("stroke-opacity", 1.0);
    if (currentIndex == -1) {
      holdFilterInput.value += `p${holdId}r${
        colorsToString[colors[nextIndex]]
      }`;
    } else {
      holdFilterInput.value = holdFilterInput.value.replace(
        `p${holdId}r${colorsToString[currentColor]}`,
        `p${holdId}r${colorsToString[colors[nextIndex]]}`
      );
    }
  }
}

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

function populateHoldFilter(db, layoutId, productSizeId, setIds) {
  const holdFilterSvg = document.getElementById("svg-hold-filter");
  const imageBaseUrl = `https://api.kilterboardapp.com/img`;
  console.log(setIds.join(","));
  const IMAGES_SQL = `
    SELECT 
      set_id,
      image_filename
    FROM product_sizes_layouts_sets
    WHERE layout_id = $layoutId
    AND product_size_id = $productSizeId
    AND set_id IN (${setIds})
  `;
  const results = db.exec(IMAGES_SQL, {
    $layoutId: layoutId,
    $productSizeId: productSizeId,
  });

  for (const [setId, imageFilename] of results[0].values) {
    const imageUrl = `${imageBaseUrl}/${imageFilename}`;
    holdFilterSvg.appendChild(getImageElement(imageUrl));
    const image = new Image();
    image.onload = function () {
      holdFilterSvg.setAttribute(
        "viewBox",
        `0 0 ${image.width} ${image.height}`
      );
      const holdsResults = db.exec(HOLDS_SQL, {
        $layoutId: layoutId,
        $setId: setId,
      });
      const productSizesResults = db.exec(PRODUCT_SIZES_SQL, {
        $productSizeId: productSizeId,
      });
      drawHoldCircles(
        holdFilterSvg,
        holdsResults[0].values,
        image.width,
        image.height,
        productSizesResults[0].values[0],
        onFilterCircleClick
      );
    };

    image.src = imageUrl;
  }
}

function populateAngleSelect(db, layoutId) {
  const results = db.exec(ANGLES_SQL, { $layoutId: layoutId });
  const angleSelect = document.getElementById("select-angle");
  for (const angle of results[0].values) {
    let option = document.createElement("option");
    option.text = angle;
    option.value = angle;
    angleSelect.appendChild(option);
  }
}

function populateGradeSelects(db) {
  const results = db.exec(GRADES_SQL);
  const minGradeSelect = document.getElementById("select-min-grade");
  const maxGradeSelect = document.getElementById("select-max-grade");
  for (
    let resultIndex = 0;
    resultIndex < results[0].values.length;
    resultIndex++
  ) {
    const [difficulty, boulderName] = results[0].values[resultIndex];
    let minOption = document.createElement("option");
    minOption.value = difficulty;
    minOption.text = boulderName;
    minOption.selected = resultIndex == 0;
    minGradeSelect.appendChild(minOption);

    let maxOption = minOption.cloneNode(true);
    maxOption.selected = resultIndex == results[0].values.length - 1;
    maxGradeSelect.appendChild(maxOption);
  }

  minGradeSelect.addEventListener("change", updateMaxOnMinChange);
  maxGradeSelect.addEventListener("change", updateMinOnMaxChange);
}

document
  .getElementById("div-hold-filter")
  .addEventListener("shown.bs.collapse", function (event) {
    event.target.scrollIntoView(true);
  });

const params = new URLSearchParams(window.location.search);
getDatabase("kilter").then((db) => {
  console.log(params.getAll("set"));
  populateAngleSelect(db, params.get("layout"));
  populateGradeSelects(db);
  populateHoldFilter(
    db,
    params.get("layout"),
    params.get("size"),
    params.getAll("set")
  );
});
