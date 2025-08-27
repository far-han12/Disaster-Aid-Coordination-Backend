import pool from '../config/db.js';

export const createMatchesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      request_id INTEGER REFERENCES aid_requests(id) ON DELETE CASCADE,
      resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'declined')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_match UNIQUE (request_id, resource_id)
    );
  `;
  try {
    await pool.query(query);
    console.log('Matches table created or already exists.');
  } catch (err) {
    console.error('Error creating matches table:', err);
  }
};