import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;


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
    console.log("✅ Database connected at:", res.rows[0].now);
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
}

export default pool;
