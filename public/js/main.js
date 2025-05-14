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



// -------------------------
// Star Rating System
// -------------------------
function initializeRatingSystem() {
  // Each .rating-input container holds a series of .rating-star elements
  const ratingInputs = document.querySelectorAll('.rating-input');
  
  ratingInputs.forEach(input => {
    const stars = input.querySelectorAll('.rating-star');
    const ratingValue = input.querySelector('input[name="rating"]');
    
    stars.forEach((star, index) => {
      // When a star is clicked, update the hidden input value
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value, 10);
        ratingValue.value = value;
        
        // Visually fill in stars up to the clicked one
        stars.forEach((s, i) => {
          if (i < value) {
            s.classList.remove('far'); // empty star
            s.classList.add('fas');    // solid star
          } else {
            s.classList.remove('fas');
            s.classList.add('far');
          }
        });
      });
      
      // Hover effect: highlight stars on mouseover
      star.addEventListener('mouseenter', () => {
        const value = parseInt(star.dataset.value, 10);
        stars.forEach((s, i) => {
          if (i < value) {
            s.classList.add('hover');
          } else {
            s.classList.remove('hover');
          }
        });
      });
    });

    // Remove hover highlighting when the mouse leaves the container
    input.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hover'));
    });
  });
}

 // Remove hover highlighting when the mouse leaves the container
    input.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hover'));
    });
  });
}


// -------------------------
// Recipe Filtering & Sorting
// -------------------------
document.addEventListener('DOMContentLoaded', function() {
  // Elements that let users filter recipes by category
  const categoryFilters = document.querySelectorAll('.category-filter');
  // Elements that let users sort recipes (e.g., newest, rating)
  const sortOptions = document.querySelectorAll('.sort-option');
  
  // For each category link, update the URL query string
  categoryFilters.forEach(filter => {
    filter.addEventListener('click', function(e) {
      e.preventDefault();  // Don’t navigate immediately

      const category = this.dataset.category;
      const url = new URL(window.location);

      if (category) {
        url.searchParams.set('category', category);
      } else {
        url.searchParams.delete('category');
      }

      // Reload the page with the new filter applied
      window.location.href = url.toString();
    });
  });
  
  // For each sort link, update sort and order parameters in the URL
  sortOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.preventDefault();

      const sort = this.dataset.sort;
      const order = this.dataset.order;
      const url = new URL(window.location);

      url.searchParams.set('sort', sort);
      url.searchParams.set('order', order);

      window.location.href = url.toString();
    });
  });
});