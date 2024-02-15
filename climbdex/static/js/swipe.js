document.addEventListener("DOMContentLoaded", function () {
  let startX;
  let endX;
  const threshold = 150; // Minimum distance of swipe

  // Function to simulate button click and add button hover
  function simulateClick(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.click();
      addHoverEffect(elementId);
      setTimeout(function () {
        removeHoverEffect(elementId);
      }, 200);
    }
  }

  function addHoverEffect(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add("simulated-button-click");
    }
  }

  function removeHoverEffect(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove("simulated-button-click");
    }
  }

  document.addEventListener(
    "touchstart",
    function (e) {
      startX = e.changedTouches[0].screenX;
    },
    false
  );

  document.addEventListener(
    "touchend",
    function (e) {
      endX = e.changedTouches[0].screenX;

      // Check if swipe is right to left (next)
      if (startX > endX + threshold) {
        simulateClick("button-next");
      }
      // Check if swipe is left to right (previous)
      else if (startX < endX - threshold) {
        simulateClick("button-prev");
      }
    },
    false
  );

  // Arrow keys detection
  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "ArrowLeft") {
        simulateClick("button-prev");
      }
      if (e.key === "ArrowRight") {
        simulateClick("button-next");
      }
    },
    false
  );
});
