// auth middleware
module.exports = {
    // for protected pages (like profile/edit)
    isAuthenticated: (req, res, next) => {
      if (req.session && req.session.user) {
        return next();
      }
  
      req.session.error = 'Please log in to access this page';
      return res.redirect('/users/login');
    },
  
    // blocks access to login/register when already logged in
    isNotAuthenticated: (req, res, next) => {
      if (req.session && req.session.user) {
        return res.redirect('/');
      }
  
      return next();
    },
  
    // used for API auth (no redirects)
    apiAuth: (req, res, next) => {
      if (req.session && req.session.user) {
        return next();
      }
  
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
  };
  