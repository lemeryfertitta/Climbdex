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

function resetHolds() {
  const circles = document.getElementsByTagNameNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  for (const circle of circles) {
    circle.setAttribute("stroke-opacity", 0.0);
    circle.setAttribute("stroke", "black");
  }
}

document
  .getElementById("button-reset-holds")
  .addEventListener("click", resetHolds);

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

document
  .getElementById("button-publish-climb")
  .addEventListener("click", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const board = urlParams.get("board");
    const layout_id = parseInt(urlParams.get("layout"));
    const name = document.getElementById("name").value;
    const is_matching = document.querySelector('input[name="is_matching"]:checked').id === "matching";
    const hasDescription = document.getElementById("description").value != "";
    const description = (is_matching ? "" : "No matching.") + (hasDescription ? " " : "") + document.getElementById("description").value;
    const is_draft = document.querySelector('input[name="is_draft"]:checked').id === "draft";
    const frames = getFrames();
    const angle = parseInt(document.getElementById("select-angle").value);

    const data = {
      board: board,
      layout_id: layout_id,
      name: name,
      description: description,
      is_draft: is_draft,
      frames: frames,
      angle: angle,
    };

    fetch("/api/v1/climbs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        const successAlert = document.querySelector(".alert-success");
        successAlert.style.display = "block";

        setTimeout(() => {
          successAlert.style.display = "none";
          const setModal = document.getElementById("div-set-modal");
          const modalInstance = bootstrap.Modal.getInstance(setModal);
          if (modalInstance) {
            modalInstance.hide();
          }
        }, 3000);
      })
      .catch((error) => {
        console.error("Error:", error);
        const errorAlert = document.querySelector(".alert-danger");
        errorAlert.style.display = "block";

        setTimeout(() => {
          errorAlert.style.display = "none";
        }, 3000);
      });
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
