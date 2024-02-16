document.addEventListener("DOMContentLoaded", function () {
  let startX;
  let endX;
  let startY;
  let endY;
  const threshold = 100; // Minimum distance of swipe
  const touchSensitivity = 10; // Sensitivity for distinguishing between swipe and pinch

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
     // Start positions for X and Y
     startX = e.touches[0].screenX;
     startY = e.touches[0].screenY;
   },
   false
 );

 document.addEventListener(
     "touchend",
     function (e) {
       // End positions for X and Y
       endX = e.changedTouches[0].screenX;
       endY = e.changedTouches[0].screenY;

       // Calculate distance moved in both directions
       const deltaX = endX - startX;
       const deltaY = endY - startY;

       // Only detect swipes with more horizontal movement than vertical to avoid interfering with vertical scroll
       if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaY) < touchSensitivity) {
         // Check if swipe is right to left (next)
         if (startX > endX + threshold) {
           simulateClick("button-next");
         }
         // Check if swipe is left to right (previous)
         else if (startX < endX - threshold) {
           simulateClick("button-prev");
         }
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
