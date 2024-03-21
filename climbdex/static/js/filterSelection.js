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

function mergeTooltips(slider, threshold, separator) {
  const textIsRtl = getComputedStyle(slider).direction === "rtl";
  const isRtl = slider.noUiSlider.options.direction === "rtl";
  const isVertical = slider.noUiSlider.options.orientation === "vertical";
  const tooltips = slider.noUiSlider.getTooltips();
  const origins = slider.noUiSlider.getOrigins();

  // Move tooltips into the origin element. The default stylesheet handles this.
  tooltips.forEach(function (tooltip, index) {
    if (tooltip) {
      origins[index].appendChild(tooltip);
    }
  });

  slider.noUiSlider.on(
    "update",
    function (values, handle, unencoded, tap, positions) {
      const pools = [[]];
      const poolPositions = [[]];
      const poolValues = [[]];
      let atPool = 0;

      // Assign the first tooltip to the first pool, if the tooltip is configured
      if (tooltips[0]) {
        pools[0][0] = 0;
        poolPositions[0][0] = positions[0];
        poolValues[0][0] = values[0];
      }

      for (
        let positionIndex = 1;
        positionIndex < positions.length;
        positionIndex++
      ) {
        if (
          !tooltips[positionIndex] ||
          positions[positionIndex] - positions[positionIndex - 1] > threshold
        ) {
          atPool++;
          pools[atPool] = [];
          poolValues[atPool] = [];
          poolPositions[atPool] = [];
        }

        if (tooltips[positionIndex]) {
          pools[atPool].push(positionIndex);
          poolValues[atPool].push(values[positionIndex]);
          poolPositions[atPool].push(positions[positionIndex]);
        }
      }

      pools.forEach(function (pool, poolIndex) {
        const handlesInPool = pool.length;

        for (let handleIndex = 0; handleIndex < handlesInPool; handleIndex++) {
          const handleNumber = pool[handleIndex];

          if (handleIndex === handlesInPool - 1) {
            let offset = 0;

            poolPositions[poolIndex].forEach(function (value) {
              offset += 1000 - value;
            });

            const direction = isVertical ? "bottom" : "right";
            const last = isRtl ? 0 : handlesInPool - 1;
            const lastOffset = 1000 - poolPositions[poolIndex][last];
            offset =
              (textIsRtl && !isVertical ? 100 : 0) +
              offset / handlesInPool -
              lastOffset;

            // Center this tooltip over the affected handles
            tooltips[handleNumber].innerHTML =
              poolValues[poolIndex].join(separator);
            tooltips[handleNumber].style.display = "block";
            tooltips[handleNumber].style[direction] = offset + "%";
          } else {
            // Hide this tooltip
            tooltips[handleNumber].style.display = "none";
          }
        }
      });
    }
  );
}

function createSlider() {
  const format = {
    to: function (value) {
      return arbitraryValuesForSlider[Math.round(value)];
    },
    from: function (value) {
      return arbitraryValuesForSlider.indexOf(value);
    },
  };

  const arbitraryValuesSlider = document.getElementById("grade-slider");
  const slider = noUiSlider.create(arbitraryValuesSlider, {
    // Start values are parsed by 'format'
    start: [
      arbitraryValuesForSlider[0],
      arbitraryValuesForSlider[arbitraryValuesForSlider.length - 1],
    ],
    range: { min: 0, max: arbitraryValuesForSlider.length - 1 },
    step: 1,
    connect: true,
    tooltips: true,
    format: format,
  });

  mergeTooltips(arbitraryValuesSlider, 10, " - ");

  // Update hidden values with slider values
  slider.on("update", function (values, handle) {
    document.getElementById("slider-minValue").value = values[0];
    document.getElementById("slider-maxValue").value = values[1];
  });

  // Convert slider values to numeric difficulty before form submit
  document
    .getElementById("form-search")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const minGradeValue = document.getElementById("slider-minValue").value;
      const maxGradeValue = document.getElementById("slider-maxValue").value;
      const convertedMinGrade = gradeMapping[minGradeValue];
      const convertedMaxGrade = gradeMapping[maxGradeValue];
      document.getElementById("slider-minValue").value = convertedMinGrade;
      document.getElementById("slider-maxValue").value = convertedMaxGrade;
      this.submit();
    });
}
