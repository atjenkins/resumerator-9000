import dotenv from "dotenv";

// MUST load environment variables FIRST before any other imports
dotenv.config();

import express from "express";
import cors from "cors";

// Import routes
import profileRoutes from "../routes/profile.routes";
import resumesRoutes from "../routes/resumes.routes";
import companiesRoutes from "../routes/companies.routes";
import jobsRoutes from "../routes/jobs.routes";
import analysesRoutes from "../routes/analyses.routes";
import activityRoutes from "../routes/activity.routes";
import aiRoutes from "../routes/ai.routes";
import exportRoutes from "../routes/export.routes";

// Import middleware
import { errorMiddleware } from "../middleware/error.middleware";

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Global Middleware
// ============================================================

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173", // Local Vite dev server
  "http://localhost:3000", // Local Express server
  process.env.FRONTEND_URL, // Vercel production URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list or matches vercel.app domain
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================================
// API Routes
// ============================================================

app.use("/api/profile", profileRoutes);
app.use("/api/resumes", resumesRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/analyses", analysesRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/export", exportRoutes);

// ============================================================
// Health & Info Routes
// ============================================================

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API info
app.get("/", (_req, res) => {
  res.json({
    name: "Resumerator 9000 API",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      profile: "/api/profile",
      resumes: "/api/resumes",
      companies: "/api/companies",
      jobs: "/api/jobs",
      analyses: "/api/analyses",
      activity: "/api/activity",
      ai: "/api/ai",
      export: "/api/export",
      health: "/health",
    },
    documentation: {
      profile: "User profile management",
      resumes: "Resume CRUD + AI operations (upload, parse)",
      companies: "Company CRUD + AI parsing",
      jobs: "Job CRUD + AI parsing",
      analyses: "First-class analysis entities (queryable results)",
      activity: "Activity log (audit trail of all operations)",
      ai: "Unified AI operations (analyze, generate)",
      export: "Export profile/resume/company/job as markdown, PDF, or DOCX",
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist",
  });
});

// ============================================================
// Error Handling
// ============================================================

app.use(errorMiddleware);

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, () => {
  console.log(`🚀 Resumerator 9000 API running at http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/`);
});

export default app;
