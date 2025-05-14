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
