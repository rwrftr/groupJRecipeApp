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

    // ---------------------------------------------------------------------------
  // Grab a filtered/sorted/paginated list of recipes.
  // `options` can hold { category, search, sortBy, sortOrder, limit, offset }.
  // ---------------------------------------------------------------------------
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT r.*, u.username,
               (SELECT AVG(rating) FROM ratings WHERE recipe_id = r.id) AS avg_rating,
               (SELECT COUNT(*) FROM ratings WHERE recipe_id = r.id) AS rating_count
        FROM recipes r
        JOIN users u ON r.user_id = u.id
      `;

      const queryParams = [];

      // --- Category filter ---------------------------------------------------
      if (options.category) {
        query += ' WHERE r.category = ?';
        queryParams.push(options.category);
      }

      // --- Text search (title OR ingredients) -------------------------------
      if (options.search) {
        const clause = options.category ? ' AND' : ' WHERE';
        query += `${clause} (r.title LIKE ? OR r.ingredients LIKE ?)`;
        queryParams.push(`%${options.search}%`, `%${options.search}%`);
      }

      // --- Sorting (allowlist to prevent SQL injection) ----------------------
      const validSort = ['created_at', 'avg_rating', 'title'];
      const sortField = validSort.includes(options.sortBy) ? options.sortBy : 'created_at';
      const sortDir   = options.sortOrder === 'asc' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortField} ${sortDir}`;

      // --- Pagination --------------------------------------------------------
      if (options.limit) {
        const limit  = parseInt(options.limit, 10)  || 10;
        const offset = parseInt(options.offset, 10) || 0;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
      }

      const rows = await all(query, queryParams);
      return rows;
    } catch (error) {
      console.error('Error getting recipes:', error);
      throw error;
    }
  }

    // ---------------------------------------------------------------------------
  // Insert a new recipe. Returns the new row’s ID.
  // image param is optional; a default placeholder is used if not provided.
  // ---------------------------------------------------------------------------
  static async create(recipeData) {
    const {
      title, description, ingredients, instructions,
      prep_time, cook_time, servings, category, image, user_id
    } = recipeData;

    try {
      const result = await run(`
        INSERT INTO recipes
          (title, description, ingredients, instructions,
           prep_time, cook_time, servings, category, image, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title,
        description,
        ingredients,
        instructions,
        prep_time,
        cook_time,
        servings,
        category,
        image || 'images/default/default-recipe.jpg',
        user_id
      ]);

      return result.lastID; // handy for redirecting straight to /recipes/:id
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Update the given recipe *only* if it belongs to `userId`.
  // Accepts a partial object (`recipeData`) and ignores fields we don’t allow.
  // Returns true if something changed, false otherwise.
  // ---------------------------------------------------------------------------
  static async update(id, recipeData, userId) {
    try {
      const allowed = [
        'title', 'description', 'ingredients', 'instructions',
        'prep_time', 'cook_time', 'servings', 'category', 'image'
      ];

      const updates = [];
      const values  = [];

      Object.keys(recipeData).forEach(key => {
        if (allowed.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(recipeData[key]);
        }
      });

      if (updates.length === 0) return false; // nothing to update

      // push id + owner check into the param list
      values.push(id, userId);

      const result = await run(
        `UPDATE recipes
            SET ${updates.join(', ')},
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?`,
        values
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Hard-delete a recipe if the user owns it.
  // ---------------------------------------------------------------------------
  static async delete(id, userId) {
    try {
      const result = await run(
        'DELETE FROM recipes WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Return a simple array of all distinct categories (for dropdowns, etc.).
  // ---------------------------------------------------------------------------
  static async getCategories() {
    try {
      const rows = await all(
        'SELECT DISTINCT category FROM recipes ORDER BY category'
      );
      return rows.map(r => r.category);
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Get every recipe authored by a specific user (for profile page).
  // ---------------------------------------------------------------------------
  static async getUserRecipes(userId) {
    try {
      const rows = await all(`
        SELECT r.*,
               (SELECT AVG(rating) FROM ratings WHERE recipe_id = r.id) AS avg_rating,
               (SELECT COUNT(*)  FROM ratings WHERE recipe_id = r.id) AS rating_count
        FROM recipes r
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      `, [userId]);

      return rows;
    } catch (error) {
      console.error('Error getting user recipes:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Create or update a rating for a recipe by a specific user.
  // If they’ve rated before we overwrite, else we insert.
  // ---------------------------------------------------------------------------
  static async rateRecipe(recipeId, userId, rating) {
    try {
      // Check if this user already rated
      const existing = await all(
        'SELECT id FROM ratings WHERE recipe_id = ? AND user_id = ?',
        [recipeId, userId]
      );

      if (existing.length) {
        // Update
        await run(
          'UPDATE ratings SET rating = ? WHERE recipe_id = ? AND user_id = ?',
          [rating, recipeId, userId]
        );
      } else {
        // Insert
        await run(
          'INSERT INTO ratings (recipe_id, user_id, rating) VALUES (?, ?, ?)',
          [recipeId, userId, rating]
        );
      }

      return true;
    } catch (error) {
      console.error('Error rating recipe:', error);
      throw error;
    }
  }
}

module.exports = Recipe;