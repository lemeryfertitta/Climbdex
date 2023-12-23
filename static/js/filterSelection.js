function onFilterCircleClick(circleElement, colorRows) {
  const holdId = circleElement.id.split("-")[1];
  const currentColor = circleElement.getAttribute("stroke");
  const colorIds = colorRows.map((colorRow) => colorRow[0]);
  const colors = colorRows.map((colorRow) => colorRow[1]);
  let currentIndex = colors.indexOf(currentColor);
  let nextIndex = currentIndex + 1;
  const holdFilterInput = document.getElementById("input-hold-filter");
  if (nextIndex >= colors.length) {
    circleElement.setAttribute("stroke-opacity", 0.0);
    circleElement.setAttribute("stroke", "black");
    holdFilterInput.value = holdFilterInput.value.replace(
      `p${holdId}r${colorIds[currentIndex]}`,
      ""
    );
  } else {
    circleElement.setAttribute("stroke", `${colors[nextIndex]}`);
    circleElement.setAttribute("stroke-opacity", 1.0);
    if (currentIndex == -1) {
      holdFilterInput.value += `p${holdId}r${colorIds[nextIndex]}`;
    } else {
      holdFilterInput.value = holdFilterInput.value.replace(
        `p${holdId}r${colorIds[currentIndex]}`,
        `p${holdId}r${colorIds[nextIndex]}`
      );
    }
  }
}

function updateMaxOnMinChange(event) {
  const minGradeFilter = event.target;
  const maxGradeFilter = document.getElementById("select-max-grade");
  if (minGradeFilter.value > maxGradeFilter.value) {
    maxGradeFilter.value = minGradeFilter.value;
    maxGradeFilter.text = minGradeFilter.text;
  }
}

function updateMinOnMaxChange(event) {
  const minGradeFilter = document.getElementById("select-min-grade");
  const maxGradeFilter = event.target;
  if (minGradeFilter.value > maxGradeFilter.value) {
    minGradeFilter.value = maxGradeFilter.value;
    minGradeFilter.text = maxGradeFilter.text;
  }
}

document
  .getElementById("div-hold-filter")
  .addEventListener("shown.bs.collapse", function (event) {
    event.target.scrollIntoView(true);
  });

document
  .getElementById("select-min-grade")
  .addEventListener("change", updateMaxOnMinChange);
document
  .getElementById("select-max-grade")
  .addEventListener("change", updateMinOnMaxChange);
