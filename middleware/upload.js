const multer = require('multer');
const path = require('path');
const fs = require('fs');

// make sure upload dirs exist
const recipesUploadDir = path.join(__dirname, '../public/uploads/recipes');
const profilesUploadDir = path.join(__dirname, '../public/uploads/profiles');

[recipesUploadDir, profilesUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// storage config based on field name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profile_image') {
      cb(null, profilesUploadDir);
    } else {
      cb(null, recipesUploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed'));
};

// uploader for recipe images (limit 5MB)
const recipeImageUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
}).single('image');

// uploader for profile images (limit 2MB)
const profileImageUpload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter
}).single('profile_image');

// export middlewares for both upload types
module.exports = {
  uploadRecipeImage: (req, res, next) => {
    recipeImageUpload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            req.fileError = 'File size too large (max 5MB)';
          } else {
            req.fileError = err.message;
          }
        } else {
          req.fileError = err.message;
        }
      }
      next();
    });
  },

  uploadProfileImage: (req, res, next) => {
    profileImageUpload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            req.fileError = 'File size too large (max 2MB)';
          } else {
            req.fileError = err.message;
          }
        } else {
          req.fileError = err.message;
        }
      }
      next();
    });
  }
};
