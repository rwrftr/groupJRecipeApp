const express = require('express');
const router = express.Router();

const Recipe = require('../../models/Recipe');
const { apiAuth } = require('../../middleware/auth');
const { recipeValidationRules, ratingValidationRules, validate } = require('../../utils/validation');

// get all recipes (supports filters, sorting, pagination)
router.get('/recipes', async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0,
      sortBy: req.query.sort || 'created_at',
      sortOrder: req.query.order || 'desc'
    };

    if (req.query.category) {
      options.category = req.query.category;
    }

    if (req.query.search) {
      options.search = req.query.search;
    }

    const recipes = await Recipe.getAll(options);

    res.json({
      status: 'success',
      data: recipes
    });
  } catch (error) {
    console.error('API error - get recipes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recipes'
    });
  }
});

// get one recipe by ID
router.get('/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipe not found'
      });
    }

    res.json({
      status: 'success',
      data: recipe
    });
  } catch (error) {
    console.error('API error - get recipe:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recipe'
    });
  }
});

// get all recipe categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Recipe.getCategories();

    res.json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    console.error('API error - get categories:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
});

// rate a recipe (auth + validation)
router.post(
  '/recipes/:id/rate',
  apiAuth,
  ratingValidationRules(),
  validate,
  async (req, res) => {
    try {
      const recipeId = req.params.id;
      const userId = req.session.user.id;
      const rating = parseInt(req.body.rating);

      await Recipe.rateRecipe(recipeId, userId, rating);

      const updatedRecipe = await Recipe.findById(recipeId);

      res.json({
        status: 'success',
        message: 'Rating submitted successfully',
        data: {
          avg_rating: updatedRecipe.avg_rating,
          rating_count: updatedRecipe.rating_count
        }
      });
    } catch (error) {
      console.error('API error - rate recipe:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit rating'
      });
    }
  }
);

// get recipes created by current user
router.get('/user/recipes', apiAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const recipes = await Recipe.getUserRecipes(userId);

    res.json({
      status: 'success',
      data: recipes
    });
  } catch (error) {
    console.error('API error - get user recipes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user recipes'
    });
  }
});

module.exports = router;
