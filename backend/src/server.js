require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { Server } = require("socket.io");

// Connect DB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Load collab socket logic
const collabSocket = require("./sockets/collabSocket");

// Attach events
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  collabSocket(io, socket);

  socket.on("disconnect", (reason) => {
    console.log("🔴 Client disconnected:", socket.id, reason);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Mode: ${process.env.NODE_ENV || "development"}`);
});
