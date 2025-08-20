import pool from '../config/db.js';

// Function to create the contact_info table
export const createContactInfoTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS contact_info (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      phone_no VARCHAR(20),
      street VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100)
    );
  `;
  try {
    await pool.query(query);
    console.log('Contact Info table created or already exists.');
  } catch (err) {
    console.error('Error creating contact_info table:', err);
  }
};