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

// -----------------------------------------------------------------------------
// EDIT RECIPE – show pre-filled form
// -----------------------------------------------------------------------------
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      req.session.error = 'Recipe not found';
      return res.redirect('/');
    }

    // Only the owner can edit
    if (recipe.user_id !== req.session.user.id) {
      req.session.error = 'You can only edit your own recipes';
      return res.redirect(`/recipes/${req.params.id}`);
    }

    const formData = req.session.formData || recipe;
    const errors   = req.session.errors   || {};

    delete req.session.formData;
    delete req.session.errors;

    const categories = await Recipe.getCategories();

    res.render('recipes/edit', {
      title: `Edit: ${recipe.title}`,
      recipe,
      formData,
      errors,
      categories
    });
  } catch (err) {
    console.error('Error loading edit form:', err);
    req.session.error = 'Failed to load edit recipe form';
    res.redirect('/');
  }
});

// -----------------------------------------------------------------------------
// EDIT RECIPE – handle POST
// -----------------------------------------------------------------------------
router.post(
  '/:id/edit',
  isAuthenticated,
  uploadRecipeImage,
  recipeValidationRules(),
  validate,
  async (req, res) => {
    try {
      const recipeId = req.params.id;
      const userId   = req.session.user.id;

      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        req.session.error = 'Recipe not found';
        return res.redirect('/');
      }
      if (recipe.user_id !== userId) {
        req.session.error = 'You can only edit your own recipes';
        return res.redirect(`/recipes/${recipeId}`);
      }

      if (req.fileError) {
        req.session.formData = req.body;
        req.session.errors   = { image: req.fileError };
        return res.redirect(`/recipes/${recipeId}/edit`);
      }

      const recipeData = {
        title:        req.body.title,
        description:  req.body.description,
        ingredients:  req.body.ingredients,
        instructions: req.body.instructions,
        prep_time:    req.body.prep_time,
        cook_time:    req.body.cook_time,
        servings:     req.body.servings,
        category:     req.body.category
      };

      if (req.file) {
        recipeData.image = `uploads/recipes/${req.file.filename}`;
      }

      const updated = await Recipe.update(recipeId, recipeData, userId);
      req.session[updated ? 'success' : 'error'] =
        updated ? 'Recipe updated successfully!' : 'No changes were made';

      res.redirect(`/recipes/${recipeId}`);
    } catch (err) {
      console.error('Error updating recipe:', err);
      req.session.error   = 'Failed to update recipe';
      req.session.formData = req.body;
      res.redirect(`/recipes/${req.params.id}/edit`);
    }
  }
);

// -----------------------------------------------------------------------------
// DELETE RECIPE
// -----------------------------------------------------------------------------
router.post('/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const deleted = await Recipe.delete(req.params.id, req.session.user.id);
    req.session[deleted ? 'success' : 'error'] =
      deleted
        ? 'Recipe deleted successfully'
        : 'Failed to delete recipe. You can only delete your own recipes.';
    res.redirect('/users/profile');
  } catch (err) {
    console.error('Error deleting recipe:', err);
    req.session.error = 'Failed to delete recipe';
    res.redirect(`/recipes/${req.params.id}`);
  }
});

// -----------------------------------------------------------------------------
// RATE RECIPE
// -----------------------------------------------------------------------------
router.post(
  '/:id/rate',
  isAuthenticated,
  ratingValidationRules(),
  validate,
  async (req, res) => {
    try {
      await Recipe.rateRecipe(
        req.params.id,
        req.session.user.id,
        parseInt(req.body.rating)
      );
      req.session.success = 'Rating submitted successfully';
      res.redirect(`/recipes/${req.params.id}`);
    } catch (err) {
      console.error('Error rating recipe:', err);
      req.session.error = 'Failed to submit rating';
      res.redirect(`/recipes/${req.params.id}`);
    }
  }
);

// -----------------------------------------------------------------------------
// ADD COMMENT
// -----------------------------------------------------------------------------
router.post('/:id/comment', isAuthenticated, async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) {
      req.session.error = 'Comment cannot be empty';
      return res.redirect(`/recipes/${req.params.id}`);
    }

    await Comment.create({
      recipe_id: req.params.id,
      user_id:   req.session.user.id,
      content
    });

    req.session.success = 'Comment added successfully';
    res.redirect(`/recipes/${req.params.id}`);
  } catch (err) {
    console.error('Error adding comment:', err);
    req.session.error = 'Failed to add comment';
    res.redirect(`/recipes/${req.params.id}`);
  }
});

// -----------------------------------------------------------------------------
// DELETE COMMENT
// -----------------------------------------------------------------------------
router.post('/comment/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const deleted = await Comment.delete(
      req.params.id,
      req.session.user.id
    );

    req.session[deleted ? 'success' : 'error'] =
      deleted
        ? 'Comment deleted successfully'
        : 'Failed to delete comment. You can only delete your own comments.';

    res.redirect(`/recipes/${req.body.recipe_id}`);
  } catch (err) {
    console.error('Error deleting comment:', err);
    req.session.error = 'Failed to delete comment';
    res.redirect('/');
  }
});

// -----------------------------------------------------------------------------
// PRINT FRIENDLY VIEW
// -----------------------------------------------------------------------------
router.get('/:id/print', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      req.session.error = 'Recipe not found';
      return res.redirect('/');
    }
    res.render('recipes/print', { recipe });
  } catch (err) {
    console.error('Error printing recipe:', err);
    req.session.error = 'Failed to generate print view';
    res.redirect(`/recipes/${req.params.id}`);
  }
});

module.exports = router;