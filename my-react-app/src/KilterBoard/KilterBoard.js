import React, { useEffect, useState, useMemo } from "react";

const getImageUrl = (imageUrl) => `/react/img/${imageUrl}`;

const KilterBoard = ({
  editEnabled = false,
  litUpHolds = "",
  imagesToHolds = defaultImagesToHolds,
  edgeLeft = 24,
  edgeRight = 120,
  edgeBottom = 0,
  edgeTop = 156,
  onCircleClick = undefined,
}) => {
  const [imageDimensions, setImageDimensions] = useState({});
  const [holdsData, setHoldsData] = useState([]);

  const holdStates = {
    OFF: "OFF",
    STARTING: "STARTING",
    HAND: "HAND",
    FOOT: "FOOT",
    FINISH: "FINISH",
  };

  const holdColours = {
    OFF: null,
    STARTING: "#00DD00",
    HAND: "#00FFFF",
    FOOT: "#FFA500",
    FINISH: "#FF00FF",
  };

  const parsedLitUpHolds = useMemo(() => {
    const holdStateMapping = {
      //TODO: Use rest api
      //kilterhw
      42: holdStates.STARTING,
      43: holdStates.HAND,
      44: holdStates.FINISH,
      45: holdStates.FOOT,
      //kilter og
      12: holdStates.STARTING,
      13: holdStates.HAND,
      14: holdStates.FINISH,
      15: holdStates.FOOT,
    };

    const litUpHoldsMap = {};

    if (litUpHolds) {
      litUpHolds.split("p").forEach((holdData) => {
        if (holdData) {
          const [holdId, stateCode] = holdData.split("r");
          litUpHoldsMap[holdId] = holdStateMapping[stateCode];
        }
      });
    }

    return litUpHoldsMap;
  }, [litUpHolds]);

  useEffect(() => {
    const loadImages = async () => {
      const dimensions = {};

      for (const imageUrl of Object.keys(imagesToHolds)) {
        const image = new Image();
        await new Promise((resolve) => {
          image.onload = () => {
            dimensions[imageUrl] = { width: image.width, height: image.height };
            resolve();
          };
          image.src = getImageUrl(imageUrl);
        });
      }

      setImageDimensions(dimensions);
    };

    loadImages();
  }, [imagesToHolds]);

  useEffect(() => {
    if (Object.keys(imageDimensions).length > 0) {
      const newHoldsData = [];

      for (const [imageUrl, holds] of Object.entries(imagesToHolds)) {
        const { width, height } = imageDimensions[imageUrl];
        const xSpacing = width / (edgeRight - edgeLeft);
        const ySpacing = height / (edgeTop - edgeBottom);

        holds.forEach(([holdId, mirroredHoldId, x, y]) => {
          if (x <= edgeLeft || x >= edgeRight || y <= edgeBottom || y >= edgeTop) {
            return;
          }

          const xPixel = (x - edgeLeft) * xSpacing;
          const yPixel = height - (y - edgeBottom) * ySpacing;

          newHoldsData.push({
            id: holdId,
            mirroredHoldId,
            cx: xPixel,
            cy: yPixel,
            r: xSpacing * 4,
            state: parsedLitUpHolds[holdId] || holdStates.OFF,
          });
        });
      }

      setHoldsData(newHoldsData);
    }
  }, [imageDimensions, imagesToHolds, edgeLeft, edgeRight, edgeBottom, edgeTop, parsedLitUpHolds]);

  const handleCircleClick = (id) => {
    setHoldsData((prevHolds) =>
      prevHolds.map((hold) =>
        hold.id === id
          ? {
              ...hold,
              state: getNextHoldState(hold.state),
            }
          : hold,
      ),
    );
  };

  const getNextHoldState = (currentState) => {
    switch (currentState) {
      case holdStates.OFF:
        return holdStates.STARTING;
      case holdStates.STARTING:
        return holdStates.HAND;
      case holdStates.HAND:
        return holdStates.FOOT;
      case holdStates.FOOT:
        return holdStates.FINISH;
      default:
        return holdStates.OFF;
    }
  };

  const viewBoxWidth = Object.values(imageDimensions)[0]?.width || 0;
  const viewBoxHeight = Object.values(imageDimensions)[0]?.height || 0;
  
  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
    >
      {Object.keys(imagesToHolds).map((imageUrl) => (
        <image key={imageUrl} href={getImageUrl(imageUrl)} width="100%" height="100%" />
      ))}
      {holdsData
        .filter((hold) => editEnabled || hold.state !== holdStates.OFF)
        .map((hold) => (
          <circle
            key={hold.id}
            id={`hold-${hold.id}`}
            data-mirror-id={hold.mirroredHoldId || undefined}
            cx={hold.cx}
            cy={hold.cy}
            r={hold.r}
            stroke={holdColours[hold.state]}
            strokeWidth={6}
            fillOpacity={0}
            onClick={editEnabled ? () => handleCircleClick(hold.id) : null}
          />
        ))}
    </svg>
  );
};

export default KilterBoard;
