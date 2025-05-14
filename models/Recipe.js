// -----------------------------------------------------------------------------
//  Recipe Model
//  -------------
//  A tiny data-layer wrapper around our SQLite helpers (`get`, `all`, `run`).
//  Each static method does one specific thing (find, list, create, etc.) and
//  always returns a promise.
//
//  Helper shortcuts imported from ../config/db:
//    • get()  – run a query that should return exactly one row
//    • all()  – run a query that returns many rows
//    • run()  – run an INSERT / UPDATE / DELETE (returns { lastID, changes })
//
//  NOTE: All SQL is parameterized (`?` placeholders) so we’re safe from
//        injection as long as we never build dynamic strings straight from
//        user input.
// -----------------------------------------------------------------------------

const { db, get, all, run } = require('../config/db');

class Recipe {
  // ---------------------------------------------------------------------------
  // Find ONE recipe by its id, along with the author’s username / avatar, the
  // average rating, and how many ratings it has.
  // ---------------------------------------------------------------------------
  static async findById(id) {
    try {
      const recipe = await get(`
        SELECT r.*, u.username, u.profile_image,
               (SELECT AVG(rating) FROM ratings WHERE recipe_id = r.id) AS avg_rating,
               (SELECT COUNT(*) FROM ratings WHERE recipe_id = r.id) AS rating_count
        FROM recipes r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
      `, [id]);

      return recipe; // either an object or undefined if not found
    } catch (error) {
      console.error('Error finding recipe by ID:', error);
      throw error; // bubble up so the controller can handle it
    }
  }
}