import pool from '../config/db.js';

// Function to create the users table if it doesn't exist
export const createUserTable = async () => {
  const tableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) CHECK(role IN ('aidrequester', 'volunteer', 'admin', 'donor')) NOT NULL
    );
  `;
  try {
    await pool.query(tableQuery);
    console.log('Users table created or already exists.');
  } catch (err) {
    console.error('Error creating users table:', err);
  }
};