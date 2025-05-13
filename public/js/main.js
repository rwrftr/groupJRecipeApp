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


// -------------------------
// Bootstrap Components Setup
// -------------------------
function initializeBootstrapComponents() {
  // Tooltips: little hover hints defined by data-bs-toggle="tooltip"
  const tooltipTriggerList = Array.from(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
  
  // Popovers: small overlay panels defined by data-bs-toggle="popover"
  const popoverTriggerList = Array.from(
    document.querySelectorAll('[data-bs-toggle="popover"]')
  );
  popoverTriggerList.forEach(el => new bootstrap.Popover(el));
}


// -------------------------
// Form Validation
// -------------------------
function initializeFormValidation() {
  // Grab every form that has the .needs-validation class
  const forms = document.querySelectorAll('.needs-validation');
  
  // For each form, prevent submission if HTML5 validation fails
  Array.prototype.slice.call(forms).forEach(function(form) {
    form.addEventListener('submit', function(event) {
      // If the form fields aren’t valid, stop the submit
      if (!form.checkValidity()) {
        event.preventDefault();   // Don’t do the default submit
        event.stopPropagation();  // Don’t bubble this event further
      }

      // Add Bootstrap’s validation styling class so invalid fields show up
      form.classList.add('was-validated');
    }, false);
  });
}


// -------------------------
// Image Preview
// -------------------------
function initializeImagePreview() {
  // Find all file inputs that accept images
  const imageInputs = document.querySelectorAll(
    'input[type="file"][accept*="image"]'
  );
  
  imageInputs.forEach(input => {
    // When the user picks a file, update the <img> preview
    input.addEventListener('change', function() {
      const previewId = this.dataset.previewTarget; // ID of the <img> tag
      const previewElement = document.getElementById(previewId);
      
      // Only proceed if we have an element and a file selected
      if (previewElement && this.files && this.files[0]) {
        const reader = new FileReader();

        // Once the file is read, set the image src and show it
        reader.onload = function(e) {
          previewElement.src = e.target.result;
          previewElement.style.display = 'block';
        };

        // Read the selected file as a Data URL (base64)
        reader.readAsDataURL(this.files[0]);
      }
    });
  });
}