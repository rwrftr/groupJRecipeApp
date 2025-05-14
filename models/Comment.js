const { db, get, all, run } = require('../config/db');

class Comment {
  // findByRecipeID:
  // Get all comments for a given recipe, newest first.
  // Also joins in each commenter’s username + avatar so the view has everything
  // it needs without extra queries.

  static async findByRecipeId(recipeId) {
    try {
      const comments = await all(`
        SELECT c.*, u.username, u.profile_image
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.recipe_id = ?
        ORDER BY c.created_at DESC
      `, [recipeId]);
      return comments;
    } catch (error) {
      console.error('Error finding comments by recipe ID:', error);
      throw error;
    }
  }
}