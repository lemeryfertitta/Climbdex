function onFilterCircleClick(circleElement, colorRows) {
  const holdId = circleElement.id.split("-")[1];
  const mirroredHoldId = circleElement.getAttribute("data-mirror-id");
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
    const colorMap = colors.reduce((acc, colorRow) => {
      acc[colorRow[0]] = colorRow[1];
      return acc;
    }, {});
    const bluetoothPacket = getBluetoothPacket(
      getFrames(),
      placementPositions,
      colorMap
    );
    illuminateClimb(board, bluetoothPacket);
  });
