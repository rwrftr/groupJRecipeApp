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

  // create:
  // Insert a new comment. Returns the new comment’s id so the controller can
  // redirect or flash a message that includes it if needed.
  static async create(commentData) {
    const { recipe_id, user_id, content } = commentData;
    
    try {
      const result = await run(
        'INSERT INTO comments (recipe_id, user_id, content) VALUES (?, ?, ?)',
        [recipe_id, user_id, content]
      );
      return result.lastID;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Delete a comment, but only if it belongs to userId (or checks at controller
  // level that the user is allowed). Returns true/false depending on whether
  // anything was removed.
  // -------------------------------------------------------------------------
  static async delete(id, userId) {
    try {
      const result = await run(
        'DELETE FROM comments WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
}

module.exports = Comment;