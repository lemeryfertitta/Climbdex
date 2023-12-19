const colors = ["#4cf0fd", "#00ff00", "#fbe400", "#ff00ff"];
const colorsToString = {
  "#4cf0fd": "13",
  "#00ff00": "12",
  "#fbe400": "15",
  "#ff00ff": "14",
};
const stringToColors = {
  13: "#4cf0fd",
  12: "#00ff00",
  15: "#fbe400",
  14: "#ff00ff",
};

function getImageElement(imageDir, imageIndex) {
  const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
  image.setAttribute("href", `${imageDir}/${imageIndex}.png`);
  return image;
}

function getData(dataName) {
  let cachedJson = {};
  return async function () {
    if (cachedJson[dataName] == undefined) {
      const response = await fetch(`data/${dataName}.json.gz`);
      const decodedStream = response.body
        .pipeThrough(new DecompressionStream("gzip"))
        .pipeThrough(new TextDecoderStream());
      const reader = decodedStream.getReader();
      let jsonString = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        } else {
          jsonString += value;
        }
      }
      cachedJson[dataName] = JSON.parse(jsonString);
    }
    return cachedJson[dataName];
  };
}

function drawHoldCircles(
  boardSvg,
  holds,
  imageWidth,
  imageHeight,
  productData,
  onClick
) {
  let xSpacing = imageWidth / (productData.edgeRight - productData.edgeLeft);
  let ySpacing = imageHeight / (productData.edgeTop - productData.edgeBottom);
  for (const [holdId, coords] of Object.entries(holds)) {
    if (
      coords[0] <= productData.edgeLeft ||
      coords[0] >= productData.edgeRight ||
      coords[1] <= productData.edgeBottom ||
      coords[1] >= productData.edgeTop
    ) {
      continue;
    }
    let x = (coords[0] - productData.edgeLeft) * xSpacing;
    let y = imageHeight - (coords[1] - productData.edgeBottom) * ySpacing;
    let circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("id", `hold-${holdId}`);
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", xSpacing * 4);
    circle.setAttribute("fill-opacity", 0.0);
    circle.setAttribute("stroke-opacity", 0.0);
    circle.setAttribute("stroke-width", 6);
    if (onClick) {
      circle.onclick = onClick;
    }
    boardSvg.appendChild(circle);
  }
}
