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

function getImageElement(imagePath) {
  const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
  image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", imagePath);
  return image;
}

async function getDatabase(databaseName) {
  const sqlJs = await initSqlJs({
    locateFile: (filename) => `/lib/sqljs-wasm/${filename}`,
  });
  const response = await fetch(`tmp/${databaseName}.sqlite3`);
  const arrayBuffer = await response.arrayBuffer();
  return new sqlJs.Database(new Uint8Array(arrayBuffer));
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
  productDimensions,
  onClick
) {
  const edgeLeft = productDimensions[0];
  const edgeRight = productDimensions[1];
  const edgeBottom = productDimensions[2];
  const edgeTop = productDimensions[3];

  let xSpacing = imageWidth / (edgeRight - edgeLeft);
  let ySpacing = imageHeight / (edgeTop - edgeBottom);
  for (const [holdId, x, y] of holds) {
    if (x <= edgeLeft || x >= edgeRight || y <= edgeBottom || y >= edgeTop) {
      continue;
    }
    let xPixel = (x - edgeLeft) * xSpacing;
    let yPixel = imageHeight - (y - edgeBottom) * ySpacing;
    let circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("id", `hold-${holdId}`);
    circle.setAttribute("cx", xPixel);
    circle.setAttribute("cy", yPixel);
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
