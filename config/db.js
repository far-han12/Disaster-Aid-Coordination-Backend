import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

// --- START: ADD THIS FOR DEBUGGING ---
console.log('--- DATABASE CONNECTION DETAILS ---');
console.log('HOST:', process.env.DB_HOST);
console.log('PORT:', process.env.DB_PORT);
console.log('USER:', process.env.DB_USER);
console.log('DATABASE:', process.env.DB_NAME);
console.log('---------------------------------');
// --- END: ADD THIS FOR DEBUGGING ---


const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export async function testDB() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("POSTGRESQL Database connected at:", res.rows[0].now);
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
}

export default pool;
