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

function checksum(data) {
  let i = 0;
  for (const value of data) {
    i = (i + value) & 255;
  }
  return ~i & 255;
}

function wrapBytes(data) {
  if (data.length > MESSAGE_BODY_MAX_LENGTH) {
    return [];
  }

  return [1, data.length, checksum(data), 2, ...data, 3];
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
    console.log("Multiple packets detected!");
    resultArray[0][0] = PACKET_FIRST;
    resultArray[resultArray.length - 1][0] = PACKET_LAST;
  }

  const finalResultArray = [];
  for (const currentArray of resultArray) {
    finalResultArray.push(...wrapBytes(currentArray));
  }

  return Uint8Array.from(finalResultArray);
}

function illuminateClimb(board, bluetoothPacket) {
  const capitalizedBoard = board[0].toUpperCase() + board.slice(1);
  navigator.bluetooth
    .requestDevice({
      filters: [
        {
          // TODO: Determine if this prefix is always the board name across all Aurora devices
          namePrefix: capitalizedBoard,
        },
      ],
      // TODO: Determine if this service UUID is the same across all Aurora devices
      optionalServices: [SERVICE_UUID],
    })
    .then((device) => {
      console.log(device);
      return device.gatt.connect();
    })
    .then((server) => {
      console.log(server);
      return server.getPrimaryService(SERVICE_UUID);
    })
    .then((service) => {
      console.log(service);
      // TODO: Determine if this characteristic UUID is the same across all Aurora devices
      return service.getCharacteristic(CHARACTERISTIC_UUID);
    })
    .then((characteristic) => {
      console.log(characteristic);
      return characteristic.writeValue(bluetoothPacket);
    })
    .then(() => console.log("Climb illuminated"));
}
