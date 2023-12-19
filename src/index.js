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

function updateProductSize(holds, products, productSizeId) {
  const productData = products[productSizeId];
  const imageDir = `media/${productSizeId}`;
  const holdFilterSvg = document.getElementById("svg-hold-filter");
  holdFilterSvg.innerHTML = "";
  holdFilterSvg.appendChild(getImageElement(imageDir, 0));
  holdFilterSvg.appendChild(getImageElement(imageDir, 1));

  const image = new Image();
  image.onload = function () {
    holdFilterSvg.setAttribute("viewBox", `0 0 ${image.width} ${image.height}`);
    drawHoldCircles(
      holdFilterSvg,
      holds,
      image.width,
      image.height,
      productData,
      onFilterCircleClick
    );
  };
  image.src = `${imageDir}/0.png`;
  document.getElementById("input-hold-filter").value = "";
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

function setFilterDefaults(grades, holds, products) {
  const boardSelect = document.getElementById("select-board");
  boardSelect.value = "10";
  updateProductSize(holds, products, "10");

  const angleSelect = document.getElementById("select-angle");
  angleSelect.value = "any";

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

getData("angles")().then((angles) => {
  getData("grades")().then((grades) => {
    getData("products")().then((products) => {
      getData("holds")().then((holds) => {
        populateFilters(angles, grades, holds, products);
        setFilterDefaults(grades, holds, products);
      });
    });
  });
});
