/**
 * Based heavily on the excellent blogpost from Philipp Bazun:
 *
 * https://web.archive.org/web/20240203155713/https://www.bazun.me/blog/kiterboard/#reversing-bluetooth
 */

const MESSAGE_BODY_MAX_LENGTH = 255;
const PACKET_MIDDLE = 81;
const PACKET_FIRST = 82;
const PACKET_LAST = 83;
const PACKET_ONLY = 84;
const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

function getChecksum(data) {
  const checksumPartial = data.reduce(
    (acc, value) => (acc + value) & MESSAGE_BODY_MAX_LENGTH,
    0
  );
  return ~checksumPartial & MESSAGE_BODY_MAX_LENGTH;
}

function wrapBytes(data) {
  return data.length > MESSAGE_BODY_MAX_LENGTH
    ? []
    : [1, data.length, getChecksum(data), 2, ...data, 3];
}

function encodePosition(position) {
  const position1 = position & 255;
  const position2 = (position & 65280) >> 8;
  return [position1, position2];
}

function encodeColor(hexColorString) {
  const color = hexColorString.substring(1);
  const substring = color.substring(0, 2);
  const substring2 = color.substring(2, 4);

  const parsedSubstring = parseInt(substring, 16) / 32;
  const parsedSubstring2 = parseInt(substring2, 16) / 32;
  const parsedResult = (parsedSubstring << 5) | (parsedSubstring2 << 2);

  const substring3 = color.substring(4, 6);
  const parsedSubstring3 = parseInt(substring3, 16) / 64;
  const finalParsedResult = parsedResult | parsedSubstring3;

  return finalParsedResult;
}

function encodePositionAndColor(position, ledColor) {
  return [...encodePosition(position), encodeColor(ledColor)];
}

function getBluetoothPacket(frames, placementPositions, colors) {
  const resultArray = [];
  let tempArray = [PACKET_MIDDLE];
  frames.split("p").forEach((frame) => {
    if (frame.length > 0) {
      const [placement, role] = frame.split("r");
      const encodedFrame = encodePositionAndColor(
        Number(placementPositions[placement]),
        colors[role]
      );
      if (tempArray.length + 3 > MESSAGE_BODY_MAX_LENGTH) {
        resultArray.push(tempArray);
        tempArray = [PACKET_MIDDLE];
      }
      tempArray.push(...encodedFrame);
    }
  });

  resultArray.push(tempArray);

  if (resultArray.length === 1) {
    resultArray[0][0] = PACKET_ONLY;
  } else if (resultArray.length > 1) {
    resultArray[0][0] = PACKET_FIRST;
    resultArray[resultArray.length - 1][0] = PACKET_LAST;
  }

  const finalResultArray = [];
  for (const currentArray of resultArray) {
    finalResultArray.push(...wrapBytes(currentArray));
  }

  return Uint8Array.from(finalResultArray);
}
