function onFilterCircleClick(circleElement, colorRows) {
  const currentColor = circleElement.getAttribute("stroke");
  const colorIds = colorRows.map((colorRow) => colorRow[0]);
  const colors = colorRows.map((colorRow) => colorRow[1]);
  let currentIndex = colors.indexOf(currentColor);
  let nextIndex = currentIndex + 1;
  if (nextIndex >= colors.length) {
    circleElement.setAttribute("stroke-opacity", 0.0);
    circleElement.setAttribute("stroke", "black");
  } else {
    circleElement.setAttribute("stroke", `${colors[nextIndex]}`);
    circleElement.setAttribute("stroke-opacity", 1.0);
    circleElement.setAttribute("data-color-id", colorIds[nextIndex]);
  }
}

function getFrames() {
  const frames = [];
  document
    .getElementById("svg-climb")
    .querySelectorAll('circle[stroke-opacity="1"]')
    .forEach((circle) => {
      const holdId = circle.id.split("-")[1];
      const colorId = circle.getAttribute("data-color-id");
      frames.push(`p${holdId}r${colorId}`);
    });
  return frames.join("");
}

document
  .getElementById("button-illuminate")
  .addEventListener("click", function () {
    const frames = getFrames();
    let bluetoothPacket = getBluetoothPacket(
      frames,
      placementPositions,
      ledColors
    );

    const urlParams = new URLSearchParams(window.location.search);
    const board = urlParams.get("board");
    illuminateClimb(board, bluetoothPacket);
  });

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
