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
