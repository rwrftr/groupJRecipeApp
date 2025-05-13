// main.js
// -------------------------
// This script wires up all interactive features on the page:
// - Boots up Bootstrap tooltips and popovers
// - Validates forms before they submit
// - Shows image previews when a user selects a file
// - Handles the star‐based rating UI
// - Filters and sorts recipes based on user clicks
// - Auto‐closes alert messages after a timeout
// The code logic itself is unchanged—only comments have been expanded
// to explain what each part does in plain, human‐friendly language.

document.addEventListener('DOMContentLoaded', function() {
  // Once the DOM is fully loaded, run our setup functions:

  // 1. Activate any Bootstrap widgets that need JS behavior.
  initializeBootstrapComponents();
  
  // 2. Turn on form validation so blank or invalid fields prevent submission.
  initializeFormValidation();

  // 3. Enable live image previews when users pick an image file.
  initializeImagePreview();

  // 4. Hook up the star rating inputs so clicking a star sets the rating.
  initializeRatingSystem();
  
  // 5. After 5 seconds, find all .alert boxes and close them smoothly.
  setTimeout(function() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    });
  }, 5000);
});

