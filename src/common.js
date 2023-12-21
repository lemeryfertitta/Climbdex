function getImageElement(imagePath) {
  const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
  image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", imagePath);
  return image;
}

async function getDatabase(databasePath) {
  const sqlJs = await initSqlJs({
    locateFile: (filename) => `/lib/sqljs-wasm/${filename}`,
  });
  const response = await fetch(databasePath);
  const decodedStream = response.body
        .pipeThrough(new DecompressionStream("gzip"));
  
  const arrayBuffer = await new Response(decodedStream).arrayBuffer();
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

function drawBoard(
  svgElement,
  db,
  layoutId,
  productSizeId,
  setIds,
  onCircleClick
) {
  const imageFilenameSql = `
    SELECT 
      set_id,
      image_filename
    FROM product_sizes_layouts_sets
    WHERE layout_id = $layoutId
    AND product_size_id = $productSizeId
    AND set_id IN (${setIds})
  `;

  const imageFilenameResults = db.exec(imageFilenameSql, {
    $layoutId: layoutId,
    $productSizeId: productSizeId,
  });

  const productSizesSql = `
    SELECT
      edge_left,
      edge_right,
      edge_bottom,
      edge_top
    FROM product_sizes
    WHERE id = $productSizeId
  `;

  const productSizesResults = db.exec(productSizesSql, {
    $productSizeId: productSizeId,
  });
  const [edgeLeft, edgeRight, edgeBottom, edgeTop] =
    productSizesResults[0].values[0];

  // const imageBaseUrl ="https://api.kilterboardapp.com/img";
  const imageBaseUrl = "https://api.tensionboardapp2.com/img";
  const holdsSql = `
    SELECT 
      placements.id,
      holes.x,
      holes.y
    FROM placements
    INNER JOIN holes
    ON placements.hole_id=holes.id
    WHERE placements.layout_id = $layoutId
    AND placements.set_id = $setId
  `;
  for (const [setId, imageFilename] of imageFilenameResults[0].values) {
    const imageUrl = `${imageBaseUrl}/${imageFilename}`;
    svgElement.appendChild(getImageElement(imageUrl));

    const holdsResults = db.exec(holdsSql, {
      $layoutId: layoutId,
      $setId: setId,
    });

    const image = new Image();
    image.onload = function () {
      svgElement.setAttribute("viewBox", `0 0 ${image.width} ${image.height}`);
      let xSpacing = image.width / (edgeRight - edgeLeft);
      let ySpacing = image.height / (edgeTop - edgeBottom);
      for (const [holdId, x, y] of holdsResults[0].values) {
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

function getColors(db, layoutId) {
  const colorSql = `
    SELECT 
      placement_roles.id,
      '#' || placement_roles.screen_color
    FROM placement_roles
    JOIN layouts
    ON layouts.product_id = placement_roles.product_id
    WHERE layouts.id = ${layoutId};
  `;
  const colorMap = {};
  for (const [id, color] of db.exec(colorSql)[0].values) {
    colorMap[id] = color;
  }
  return colorMap;
}
