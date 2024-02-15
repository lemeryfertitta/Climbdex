function updateHoldFilterCount(delta) {
  const holdFilterCount = document.getElementById("hold-filter-button");
  const currentCount = Number(holdFilterCount.getAttribute("data-count"));
  holdFilterCount.textContent = `${currentCount + delta} Selected Holds`;
  holdFilterCount.setAttribute("data-count", currentCount + delta);
}

function onFilterCircleClick(circleElement, colorRows) {
  const holdId = circleElement.id.split("-")[1];
  const mirroredHoldId = circleElement.getAttribute("data-mirror-id");
  const currentColor = circleElement.getAttribute("stroke");
  const colorIds = colorRows.map((colorRow) => colorRow[0]);
  const colors = colorRows.map((colorRow) => colorRow[1]);
  let currentIndex = colors.indexOf(currentColor);
  let nextIndex = currentIndex + 1;
  const holdFilterInput = document.getElementById("input-hold-filter");
  const mirroredHoldFilterInput = document.getElementById(
    "input-mirrored-hold-filter"
  );
  if (nextIndex >= colors.length) {
    circleElement.setAttribute("stroke-opacity", 0.0);
    circleElement.setAttribute("stroke", "black");
    holdFilterInput.value = holdFilterInput.value.replace(
      `p${holdId}r${colorIds[currentIndex]}`,
      ""
    );
    if (mirroredHoldId) {
      mirroredHoldFilterInput.value = mirroredHoldFilterInput.value.replace(
        `p${mirroredHoldId}r${colorIds[currentIndex]}`,
        ""
      );
    }
    updateHoldFilterCount(-1);
  } else {
    circleElement.setAttribute("stroke", `${colors[nextIndex]}`);
    circleElement.setAttribute("stroke-opacity", 1.0);
    if (currentIndex == -1) {
      holdFilterInput.value += `p${holdId}r${colorIds[nextIndex]}`;
      if (mirroredHoldId) {
        mirroredHoldFilterInput.value += `p${mirroredHoldId}r${colorIds[nextIndex]}`;
      }
      updateHoldFilterCount(1);
    } else {
      holdFilterInput.value = holdFilterInput.value.replace(
        `p${holdId}r${colorIds[currentIndex]}`,
        `p${holdId}r${colorIds[nextIndex]}`
      );
      if (mirroredHoldId) {
        mirroredHoldFilterInput.value = mirroredHoldFilterInput.value.replace(
          `p${mirroredHoldId}r${colorIds[currentIndex]}`,
          `p${mirroredHoldId}r${colorIds[nextIndex]}`
        );
      }
    }
  }
}

function resetHoldFilter() {
  const holdFilterInput = document.getElementById("input-hold-filter");
  holdFilterInput.value = "";
  const circles = document.getElementsByTagNameNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  for (const circle of circles) {
    circle.setAttribute("stroke-opacity", 0.0);
    circle.setAttribute("stroke", "black");
  }
  const holdFilterCount = document.getElementById("hold-filter-button");
  holdFilterCount.textContent = `0 Selected Holds`;
  holdFilterCount.setAttribute("data-count", 0);
}

document
  .getElementById("div-hold-filter")
  .addEventListener("shown.bs.collapse", function (event) {
    event.target.scrollIntoView(true);
  });

document
  .getElementById("button-reset-hold-filter")
  .addEventListener("click", resetHoldFilter);

const backAnchor = document.getElementById("anchor-back");
backAnchor.href = location.origin;
if (document.referrer) {
  referrerUrl = new URL(document.referrer);
  if (referrerUrl.origin == location.origin && referrerUrl.pathname == "/") {
    backAnchor.addEventListener("click", function (event) {
      event.preventDefault();
      history.back();
    });
  }
}
