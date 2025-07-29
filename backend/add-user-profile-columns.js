const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'notorix'
});

async function addUserProfileColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding user profile columns...');
    
    // Add bio column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bio TEXT
    `);
    console.log('✅ Added bio column to users table');
    
    // Add location column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS location VARCHAR(255)
    `);
    console.log('✅ Added location column to users table');
    
    // Update existing users with sample data
    await client.query(`
      UPDATE users 
      SET 
        bio = CASE 
          WHEN id = 1 THEN 'Community enthusiast and tech lover. Always looking to connect with like-minded people!'
          WHEN id = 2 THEN 'Passionate about building communities and sharing knowledge.'
          WHEN id = 3 THEN 'Explorer of new ideas and technologies. Love meeting new people!'
          ELSE 'Welcome to my profile! I''m excited to be part of this community.'
        END,
        location = CASE 
          WHEN id = 1 THEN 'San Francisco, CA'
          WHEN id = 2 THEN 'New York, NY'
          WHEN id = 3 THEN 'Austin, TX'
          ELSE 'Earth'
        END
      WHERE bio IS NULL OR location IS NULL
    `);
    console.log('✅ Updated existing users with sample profile data');
    
    console.log('🎉 User profile columns setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addUserProfileColumns(); 