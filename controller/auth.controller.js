import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { env } from '../config/env.js';

// This function should already be in your file
const signToken = id => {
  return jwt.sign({ id }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};


// ... other imports and functions

export const signup = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Step 1: Create the user
    const newUserRes = await client.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hashedPassword, role]
    );
    const user = newUserRes.rows[0];

    // Step 2: Create the contact info
    await client.query(
        'INSERT INTO contact_info (user_id, first_name, last_name) VALUES ($1, $2, $3)',
        [user.id, firstName, lastName]
    );

    await client.query('COMMIT');

    const token = signToken(user.id);
    user.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password!' });
    }

    // Fetch the user from the database
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
    }

    // Create and sign the token
    const token = signToken(user.id);

    // Remove password from the output
    user.password = undefined;

    // Send the response with the correct structure
    res.status(200).json({
      status: 'success',
      token,
      data: {
          user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};