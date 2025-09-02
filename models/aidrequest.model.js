import pool from '../config/db.js';

export const createAidRequestTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS aid_requests (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      aid_type VARCHAR(100) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      urgency VARCHAR(50) CHECK(urgency IN ('low', 'medium', 'high')),
      status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'fulfilled', 'cancelled')),
      -- Corrected the data type from 'timestptz' to 'TIMESTAMPTZ'
      request_date TIMESTAMPTZ DEFAULT NOW(), 
      latitude DECIMAL(9,6),
      longitude DECIMAL(9,6)
    );
  `;
  try {
    await pool.query(query);
    console.log('Aid Requests table created or already exists.');
  } catch (err) {
    console.error('Error creating aid_requests table:', err);
  }
};