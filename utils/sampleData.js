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


  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

module.exports = createSampleData;