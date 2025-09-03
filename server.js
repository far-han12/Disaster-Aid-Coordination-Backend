import dotenv from "dotenv";
dotenv.config(); // must be FIRST

import express from "express";
import cors from "cors";
import { testDB } from "./config/db.js";
import { createUserTable } from "./models/user.model.js";
import { createContactInfoTable } from "./models/contactinfo.model.js";
import { createAidRequestTable } from "./models/aidrequest.model.js";
import { createResourceTable } from "./models/resource.model.js";
import { createAssignmentsTable } from "./models/assignment.model.js";
import mainRouter from './routes/index.js';
import { createMatchesTable } from "./models/matches.model.js"; // 1. Import the new function

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', mainRouter);

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});
app.get('/', (_req, res) =>
  res.send('✅ Disaster Aid Coordination API. Try /api/v1 ')
);


app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testDB(); // test when server starts
  
  // Initialize tables
  await createUserTable();
  await createContactInfoTable();
  await createAidRequestTable();
  await createResourceTable();
  await createAssignmentsTable();
    await createMatchesTable(); 
});
