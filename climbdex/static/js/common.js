var el = document.getElementById('toast')
var toast = bootstrap.Toast.getOrCreateInstance(el)

function drawBoard(
  svgElementId,
  imagesToHolds,
  edgeLeft,
  edgeRight,
  edgeBottom,
  edgeTop,
  onCircleClick
) {
  const svgElement = document.getElementById(svgElementId);
  for (const [imageUrl, holds] of Object.entries(imagesToHolds)) {
    const imageElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image"
    );
    imageElement.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "xlink:href",
      imageUrl
    );
    svgElement.appendChild(imageElement);

    const image = new Image();
    image.onload = function () {
      svgElement.setAttribute("viewBox", `0 0 ${image.width} ${image.height}`);
      let xSpacing = image.width / (edgeRight - edgeLeft);
      let ySpacing = image.height / (edgeTop - edgeBottom);
      for (const [holdId, mirroredHoldId, x, y] of holds) {
        if (
          x <= edgeLeft ||
          x >= edgeRight ||
          y <= edgeBottom ||
          y >= edgeTop
        ) {
          continue;
        }
        let xPixel = (x - edgeLeft) * xSpacing;
        let yPixel = image.height - (y - edgeBottom) * ySpacing;
        let circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        circle.setAttribute("id", `hold-${holdId}`);
        if (mirroredHoldId) {
          circle.setAttribute("data-mirror-id", mirroredHoldId);
        }
        circle.setAttribute("cx", xPixel);
        circle.setAttribute("cy", yPixel);
        circle.setAttribute("r", xSpacing * 4);
        circle.setAttribute("fill-opacity", 0.0);
        circle.setAttribute("stroke-opacity", 0.0);
        circle.setAttribute("stroke-width", 6);
        if (onCircleClick) {
          circle.onclick = onCircleClick;
        }
        svgElement.appendChild(circle);
      }
    };
    image.src = imageUrl;
  }
}
