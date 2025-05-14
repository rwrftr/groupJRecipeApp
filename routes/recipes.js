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

// -----------------------------------------------------------------------------
// NEW RECIPE – handle POST
// -----------------------------------------------------------------------------
router.post(
  '/new',
  isAuthenticated,
  uploadRecipeImage,
  recipeValidationRules(),
  validate,
  async (req, res) => {
    try {
      // File upload failed? kick user back with message.
      if (req.fileError) {
        req.session.formData = req.body;
        req.session.errors   = { image: req.fileError };
        return res.redirect('/recipes/new');
      }

      // Build the object for the model
      const recipeData = {
        title:        req.body.title,
        description:  req.body.description,
        ingredients:  req.body.ingredients,
        instructions: req.body.instructions,
        prep_time:    req.body.prep_time,
        cook_time:    req.body.cook_time,
        servings:     req.body.servings,
        category:     req.body.category,
        user_id:      req.session.user.id
      };

      if (req.file) {
        recipeData.image = `uploads/recipes/${req.file.filename}`;
      }

      const recipeId = await Recipe.create(recipeData);
      req.session.success = 'Recipe created successfully!';
      res.redirect(`/recipes/${recipeId}`);
    } catch (err) {
      console.error('Error creating recipe:', err);
      req.session.error   = 'Failed to create recipe';
      req.session.formData = req.body;
      res.redirect('/recipes/new');
    }
  }
);

// -----------------------------------------------------------------------------
// VIEW RECIPE
// -----------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      req.session.error = 'Recipe not found';
      return res.redirect('/');
    }

    const comments = await Comment.findByRecipeId(req.params.id);

    const baseUrl    = `${req.protocol}://${req.get('host')}`;
    const currentUrl = `${baseUrl}${req.originalUrl}`;

    res.render('recipes/view', {
      title: recipe.title,
      recipe,
      comments,
      baseUrl,
      currentUrl
    });
  } catch (err) {
    console.error('Error viewing recipe:', err);
    req.session.error = 'Failed to load recipe';
    res.redirect('/');
  }
});