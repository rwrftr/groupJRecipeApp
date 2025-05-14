const express = require('express');
const router = express.Router();

const Recipe  = require('../models/Recipe');
const Comment = require('../models/Comment');

const {
  recipeValidationRules,
  ratingValidationRules,
  validate
} = require('../utils/validation');

const { isAuthenticated }  = require('../middleware/auth');
const { uploadRecipeImage } = require('../middleware/upload');

// -----------------------------------------------------------------------------
// NEW RECIPE – show empty form
// -----------------------------------------------------------------------------
router.get('/new', isAuthenticated, async (req, res) => {
  try {
    // Grab any sticky form data & errors we stashed in the session
    const formData = req.session.formData || {};
    const errors   = req.session.errors   || {};

    delete req.session.formData;
    delete req.session.errors;

    const categories = await Recipe.getCategories();

    res.render('recipes/new', {
      title: 'Create Recipe',
      formData,
      errors,
      categories
    });
  } catch (err) {
    console.error('Error loading new-recipe form:', err);
    req.session.error = 'Failed to load create recipe form';
    res.redirect('/');
  }
});