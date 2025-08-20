import pool from '../config/db.js';

// Function to create the resources table
export const createResourceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      donor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      resource_type VARCHAR(100) NOT NULL,
      quantity INTEGER NOT NULL,
      latitude DECIMAL(9,6),
      longitude DECIMAL(9,6)
    );
  `;
  try {
    await pool.query(query);
    console.log('Resources table created or already exists.');
  } catch (err) {
    console.error('Error creating resources table:', err);
  }
};