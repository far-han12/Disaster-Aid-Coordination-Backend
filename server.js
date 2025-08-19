import dotenv from "dotenv";
dotenv.config();   // must be FIRST

import express from "express";
import { testDB } from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testDB(); // test when server starts
});
