const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const { userValidationRules, validate } = require('../utils/validation');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');

// User registration
router.get('/register', isNotAuthenticated, (req, res) => {
  const formData = req.session.formData || {};
  const errors = req.session.errors || {};
  
  delete req.session.formData;
  delete req.session.errors;
  
  res.render('users/register', {
    title: 'Register',
    formData,
    errors
  });
});

router.post('/register', isNotAuthenticated, userValidationRules(), validate, async (req, res) => {
  try {
    // Check if email already exists
    const existingUser = await User.findByEmail(req.body.email);
    if (existingUser) {
      req.session.formData = req.body;
      req.session.errors = { email: 'Email already in use' };
      return res.redirect('/users/register');
    }
    
    // Create new user
    const userId = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });
    
    req.session.success = 'Registration successful! Please log in.';
    res.redirect('/users/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.session.error = 'Registration failed. Please try again.';
    res.redirect('/users/register');
  }
});

// User login
router.get('/login', isNotAuthenticated, (req, res) => {
  const formData = req.session.formData || {};
  const errors = req.session.errors || {};
  
  delete req.session.formData;
  delete req.session.errors;
  
  res.render('users/login', {
    title: 'Login',
    formData,
    errors
  });
});

router.post('/login', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      req.session.formData = req.body;
      req.session.errors = { general: 'Please provide both email and password' };
      return res.redirect('/users/login');
    }
    
    // Authenticate user
    const user = await User.authenticate(email, password);
    if (!user) {
      req.session.formData = { email };
      req.session.errors = { general: 'Invalid email or password' };
      return res.redirect('/users/login');
    }
    
    // Set user session
    req.session.user = user;
    req.session.success = `Welcome back, ${user.username}!`;
    
    // Redirect to dashboard or previous page
    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    
    res.redirect(redirectTo);
  } catch (error) {
    console.error('Login error:', error);
    req.session.error = 'Login failed. Please try again.';
    res.redirect('/users/login');
  }
});

// User logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// User profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    const recipes = await Recipe.getUserRecipes(userId);
    
    res.render('users/profile', {
      title: 'My Profile',
      user,
      recipes
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    req.session.error = 'Failed to load profile';
    res.redirect('/');
  }
});

// Edit profile
router.get('/edit-profile', isAuthenticated, (req, res) => {
  const formData = req.session.formData || req.session.user;
  const errors = req.session.errors || {};
  
  delete req.session.formData;
  delete req.session.errors;
  
  res.render('users/edit-profile', {
    title: 'Edit Profile',
    formData,
    errors
  });
});

router.post('/edit-profile', isAuthenticated, uploadProfileImage, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const updateData = {
      username: req.body.username,
      email: req.body.email
    };
    
    // Handle profile image
    if (req.file) {
      updateData.profile_image = `uploads/profiles/${req.file.filename}`;
    }
    
    // Handle file upload error
    if (req.fileError) {
      req.session.formData = req.body;
      req.session.errors = { profile_image: req.fileError };
      return res.redirect('/users/edit-profile');
    }
    
    // Update user
    const updated = await User.update(userId, updateData);
    if (updated) {
      // Update session data
      const updatedUser = await User.findById(userId);
      req.session.user = updatedUser;
      req.session.success = 'Profile updated successfully';
    } else {
      req.session.error = 'No changes were made';
    }
    
    res.redirect('/users/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.session.error = 'Failed to update profile';
    res.redirect('/users/edit-profile');
  }
});

module.exports = router; 