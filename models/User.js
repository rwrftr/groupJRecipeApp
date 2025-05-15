const { db, get, all, run } = require('../config/db');

class User {
  // get basic user data by ID
  static async findById(id) {
    try {
      const user = await get(
        'SELECT id, username, email, profile_image, created_at FROM users WHERE id = ?',
        [id]
      );
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // get full user by email (used for login)
  static async findByEmail(email) {
    try {
      const user = await get(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
}

module.exports = User;
const bcrypt = require('bcrypt');

// create new user w/ hashed password
User.create = async function (userData) {
  const { username, email, password, profile_image = 'images/default/default-profile.jpg' } = userData;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await run(
      'INSERT INTO users (username, email, password, profile_image) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, profile_image]
    );

    return result.lastID;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// check credentials and return user (no password)
User.authenticate = async function (email, password) {
  try {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;

    delete user.password;
    return user;
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
};
