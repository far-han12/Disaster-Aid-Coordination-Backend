import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

// --- Debugging (optional) ---
console.log('--- DATABASE CONNECTION ---');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('---------------------------');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required by Neon
});

export async function testDB() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected at:", res.rows[0].now);
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
}

export default pool;
