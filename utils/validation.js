const { body, validationResult } = require('express-validator');

// user form validation
const userValidationRules = () => {
  return [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),

    body('confirm_password')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ];
};

// recipe form validation
const recipeValidationRules = () => {
  return [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 100 })
      .withMessage('Title must be less than 100 characters'),

    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),

    body('ingredients')
      .trim()
      .notEmpty()
      .withMessage('Ingredients are required'),

    body('instructions')
      .trim()
      .notEmpty()
      .withMessage('Instructions are required'),

    body('prep_time')
      .isInt({ min: 1 })
      .withMessage('Preparation time must be a positive number'),

    body('cook_time')
      .isInt({ min: 0 })
      .withMessage('Cooking time must be a non-negative number'),

    body('servings')
      .isInt({ min: 1 })
      .withMessage('Servings must be a positive number'),

    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
  ];
};

// rating form validation
const ratingValidationRules = () => {
  return [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5')
  ];
};

// shared middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // api requests get json errors
  if (req.path.startsWith('/api/')) {
    return res.status(422).json({ 
      status: 'error',
      errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  }

  // web requests get redirected with session error data
  req.session.formData = req.body;
  req.session.errors = errors.array().reduce((acc, err) => {
    acc[err.param] = err.msg;
    return acc;
  }, {});

  return res.redirect('back');
};

module.exports = {
  userValidationRules,
  recipeValidationRules,
  ratingValidationRules,
  validate
};
