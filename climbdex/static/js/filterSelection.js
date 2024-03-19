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

    var textIsRtl = getComputedStyle(slider).direction === 'rtl';
    var isRtl = slider.noUiSlider.options.direction === 'rtl';
    var isVertical = slider.noUiSlider.options.orientation === 'vertical';
    var tooltips = slider.noUiSlider.getTooltips();
    var origins = slider.noUiSlider.getOrigins();

    // Move tooltips into the origin element. The default stylesheet handles this.
    tooltips.forEach(function (tooltip, index) {
        if (tooltip) {
            origins[index].appendChild(tooltip);
        }
    });

    slider.noUiSlider.on('update', function (values, handle, unencoded, tap, positions) {

        var pools = [[]];
        var poolPositions = [[]];
        var poolValues = [[]];
        var atPool = 0;

        // Assign the first tooltip to the first pool, if the tooltip is configured
        if (tooltips[0]) {
            pools[0][0] = 0;
            poolPositions[0][0] = positions[0];
            poolValues[0][0] = values[0];
        }

        for (var i = 1; i < positions.length; i++) {
            if (!tooltips[i] || (positions[i] - positions[i - 1]) > threshold) {
                atPool++;
                pools[atPool] = [];
                poolValues[atPool] = [];
                poolPositions[atPool] = [];
            }

            if (tooltips[i]) {
                pools[atPool].push(i);
                poolValues[atPool].push(values[i]);
                poolPositions[atPool].push(positions[i]);
            }
        }

        pools.forEach(function (pool, poolIndex) {
            var handlesInPool = pool.length;

            for (var j = 0; j < handlesInPool; j++) {
                var handleNumber = pool[j];

                if (j === handlesInPool - 1) {
                    var offset = 0;

                    poolPositions[poolIndex].forEach(function (value) {
                        offset += 1000 - value;
                    });

                    var direction = isVertical ? 'bottom' : 'right';
                    var last = isRtl ? 0 : handlesInPool - 1;
                    var lastOffset = 1000 - poolPositions[poolIndex][last];
                    offset = (textIsRtl && !isVertical ? 100 : 0) + (offset / handlesInPool) - lastOffset;

                    // Center this tooltip over the affected handles
                    tooltips[handleNumber].innerHTML = poolValues[poolIndex].join(separator);
                    tooltips[handleNumber].style.display = 'block';
                    tooltips[handleNumber].style[direction] = offset + '%';
                } else {
                    // Hide this tooltip
                    tooltips[handleNumber].style.display = 'none';
                }
            }
        });
    });
}

function convertGrade(value) {
  if (gradeMapping[value]) {
    return gradeMapping[value];
  }
  return null;
}
