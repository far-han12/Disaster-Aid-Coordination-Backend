import pool from '../config/db.js';

// Function to create the assignments table
export const createAssignmentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      request_id INTEGER REFERENCES aid_requests(id) ON DELETE CASCADE,
      volunteer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      assigned_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      assignment_date TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_assignment UNIQUE (request_id, volunteer_id)
    );
  `;
  try {
    await pool.query(query);
    console.log('Assignments table created or already exists.');
  } catch (err) {
    console.error('Error creating assignments table:', err);
  }
};
