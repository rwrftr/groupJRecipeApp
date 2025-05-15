const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const createSampleData = require('./utils/sampleData');

// Import routes
const indexRoutes = require('./routes/index');
const recipeRoutes = require('./routes/recipes');
const userRoutes = require('./routes/users');
const apiRoutes = require('./routes/api/index');

const app = express();
const PORT = process.env.PORT || 3001;

// Set environment
app.set('env', process.env.NODE_ENV || 'development');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: 'recipe_sharing_platform_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/recipes', recipeRoutes);
app.use('/users', userRoutes);
app.use('/api', apiRoutes);

// Error handling
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Add sample data in development mode
  if (app.get('env') === 'development') {
    setTimeout(() => {
      createSampleData().catch(err => {
        console.error('Failed to create sample data:', err);
      });
    }, 1000); // Wait for DB to initialize
  }
});

module.exports = app; 