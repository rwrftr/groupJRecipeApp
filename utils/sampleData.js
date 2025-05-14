const bcrypt = require('bcrypt');
const { run, all } = require('../config/db');

/*
  Populates the DB with a couple of users, some recipes, ratings, and comments.
  Handy when you spin up the project locally and need something to look at.
*/
async function createSampleData() {
  try {
    console.log('Adding sample data...');
    
    // --- Users ------------------------------------------------------------
    // We hash one password and reuse it for both demo accounts.
    const password = await bcrypt.hash('password123', 10);

    await run(
      `INSERT OR IGNORE INTO users (username, email, password, profile_image)
        VALUES (?, ?, ?, ?)`,
      ['johndoe', 'john@example.com', password, 'images/default/default-profile.jpg']
    );

    await run(
      `INSERT OR IGNORE INTO users (username, email, password, profile_image)
        VALUES (?, ?, ?, ?)`,
      ['janedoe', 'jane@example.com', password, 'images/default/default-profile.jpg']
    );

    // Grab the first two user IDs—we’ll need them for recipes, ratings, comments.
    const users = await all('SELECT id FROM users LIMIT 2');
    if (!users.length) {
      console.log('No users found, skipping recipe creation');
      return;
    }

    // --- Recipes for user #1 ---------------------------------------------
    const userId1 = users[0].id;
    await run(
      `INSERT OR IGNORE INTO recipes (
        title, description, ingredients, instructions,
        prep_time, cook_time, servings, category, image, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Classic Pancakes',
        'Fluffy and delicious pancakes for a perfect breakfast.',
        '1 cup all-purpose flour\n1/4 cup sugar\n1 tablespoon baking powder\n1/2 teaspoon salt\n1 cup milk\n1 large egg\n2 tablespoons vegetable oil',
        '1. Whisk together dry ingredients.\n2. Add wet ingredients; mix.\n3. Cook on a hot griddle until golden.',
        10,
        15,
        4,
        'Breakfast',
        'images/default/default-recipe.jpg',
        userId1
      ]
    );

    // --- Recipes for user #2 ---------------------------------------------
    const userId2 = users[1] ? users[1].id : userId1; // fallback if only one user
    await run(
      `INSERT OR IGNORE INTO recipes (
        title, description, ingredients, instructions,
        prep_time, cook_time, servings, category, image, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Chocolate Chip Cookies',
        'Classic chewy chocolate chip cookies everyone will love.',
        'Flour\nBaking soda\nButter\nSugars\nSalt\nVanilla\nEggs\nChocolate chips',
        'Mix dough, scoop, bake until brown.',
        15,
        25,
        24,
        'Desserts',
        'images/default/default-recipe.jpg',
        userId2
      ]
    );

    await run(
      `INSERT OR IGNORE INTO recipes (
        title, description, ingredients, instructions,
        prep_time, cook_time, servings, category, image, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Vegetable Stir Fry',
        'A quick and healthy vegetable stir fry with a delicious sauce.',
        'Oil\nGarlic\nGinger\nBell pepper\nCarrot\nBroccoli\nSnow peas\nSoy sauce\nHoney\nCornstarch slurry',
        'Quick fry veggies, add sauce, let it thicken. Serve.',
        15,
        10,
        2,
        'Main Dishes',
        'images/default/default-recipe.jpg',
        userId2
      ]
    );

    // --- Ratings ----------------------------------------------------------
    await run(
      `INSERT OR IGNORE INTO ratings (recipe_id, user_id, rating)
       VALUES (1, 2, 5)`
    );
    await run(
      `INSERT OR IGNORE INTO ratings (recipe_id, user_id, rating)
       VALUES (2, 2, 4)`
    );
    await run(
      `INSERT OR IGNORE INTO ratings (recipe_id, user_id, rating)
       VALUES (3, 1, 5)`
    );
    await run(
      `INSERT OR IGNORE INTO ratings (recipe_id, user_id, rating)
       VALUES (4, 1, 4)`
    );

    // --- Comments ---------------------------------------------------------
    await run(
      `INSERT OR IGNORE INTO comments (recipe_id, user_id, content, created_at)
       VALUES (?, ?, ?, datetime('now', '-2 days'))`,
      [1, 2, 'These pancakes are amazing! My kids loved them.']
    );
    await run(
      `INSERT OR IGNORE INTO comments (recipe_id, user_id, content, created_at)
       VALUES (?, ?, ?, datetime('now', '-1 day'))`,
      [1, 1, 'Thanks for the recipe! I added vanilla—it was delicious.']
    );
    await run(
      `INSERT OR IGNORE INTO comments (recipe_id, user_id, content, created_at)
       VALUES (?, ?, ?, datetime('now', '-3 hours'))`,
      [2, 2, 'Simple and refreshing. Perfect for summer!']
    );
    await run(
      `INSERT OR IGNORE INTO comments (recipe_id, user_id, content, created_at)
       VALUES (?, ?, ?, datetime('now', '-5 hours'))`,
      [3, 1, 'Cookies turned out great—super chewy!']
    );
    await run(
      `INSERT OR IGNORE INTO comments (recipe_id, user_id, content, created_at)
       VALUES (?, ?, ?, datetime('now', '-1 hour'))`,
      [4, 1, 'Healthy and tasty. I tossed in tofu for protein.']
    );
        


  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

module.exports = createSampleData;