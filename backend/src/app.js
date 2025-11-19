const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

// ✅ FIXED: Correct case for route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const projectRoutes = require("./routes/projects");
const jobRoutes = require("./routes/jobs");
const blogRoutes = require("./routes/blogRoutes");

// ✅ NEW: run route (code execution)
const runRoute = require("./routes/run");

const app = express();

// ✅ Enhanced Helmet config (no warnings)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disable CSP to avoid blocking typical dev assets
}));

// Logging
app.use(morgan("dev"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Improved CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://willowy-jelly-da7302.netlify.app"
];


console.log("✅ Allowed CORS origins:", allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Handle preflight requests
app.options('*', cors());

// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("📁 Created uploads directory");
}

// Serve static files
app.use("/uploads", express.static(uploadsPath));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API Routes
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/blogs", blogRoutes);

// === RUN ROUTE MOUNTED HERE ===
app.use("/api/run", runRoute);

// Enhanced health check
app.get("/", (req, res) => {
  res.json({
    message: "🚀 DevConnect API Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: "1.0.0"
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "operational",
    serverTime: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);

  // CORS errors
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked the request",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
