const express = require('express');
const router  = express.Router();

const Recipe  = require('../models/Recipe');

/*
  ==========================================================
  HOME PAGE
  ----------------------------------------------------------
  • Grabs the eight newest recipes for the hero section.
  • Pulls four highest-rated recipes for a “Popular” row.
  • Fetches all distinct categories for the browse dropdown.
*/
router.get('/', async (req, res) => {
  try {
    const latestRecipes = await Recipe.getAll({
      limit: 8,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    const popularRecipes = await Recipe.getAll({
      limit: 4,
      sortBy: 'avg_rating',
      sortOrder: 'desc'
    });

    const categories = await Recipe.getCategories();

    res.render('home', {
      title: 'Recipe Sharing Platform',
      latestRecipes,
      popularRecipes,
      categories
    });
  } catch (error) {
    console.error('Error fetching home page data:', error);
    res.status(500).render('error', {
      message: 'Something went wrong',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/*  ABOUT PAGE
    Static marketing copy — no DB calls needed. */
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

/*
  ==========================================================
  EXPLORE PAGE  (paginated browse)
  ----------------------------------------------------------
  Accepts optional ?page, ?category, ?search, ?sort, ?order.
  Defaults to page 1, sorted by newest first.
*/
router.get('/explore', async (req, res) => {
  try {
    const page   = parseInt(req.query.page) || 1;
    const limit  = 12;                      // 12 cards per page
    const offset = (page - 1) * limit;

    // Build options object the model understands
    const options = {
      limit,
      offset,
      sortBy:   req.query.sort  || 'created_at',
      sortOrder:req.query.order || 'desc'
    };

    if (req.query.category) options.category = req.query.category;
    if (req.query.search)   options.search   = req.query.search;

    const recipes    = await Recipe.getAll(options);
    const categories = await Recipe.getCategories();

    res.render('explore', {
      title:        'Explore Recipes',
      recipes,
      categories,
      currentCategory: req.query.category || '',
      currentSearch:   req.query.search   || '',
      currentSort:     options.sortBy,
      currentOrder:    options.sortOrder,
      page,
      searchQuery:     req.query          // keeps filters in pagination links
    });
  } catch (error) {
    console.error('Error in explore page:', error);
    res.status(500).render('error', {
      message: 'Failed to load recipes',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/*
  ==========================================================
  SEARCH RESULTS
  ----------------------------------------------------------
  Quick search endpoint. If no query (?q=) is provided, we
  just bounce the user back to /explore so the URL stays tidy.
*/
router.get('/search', async (req, res) => {
  try {
    if (!req.query.q) {
      return res.redirect('/explore');
    }

    const recipes = await Recipe.getAll({
      search: req.query.q,
      limit:  20
    });

    res.render('search-results', {
      title:       `Search Results: ${req.query.q}`,
      searchTerm:  req.query.q,
      recipes,
      count:       recipes.length
    });
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).render('error', {
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

module.exports = router;
