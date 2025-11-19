const Project = require("../models/Project");

// In-memory room storage
const rooms = {};

module.exports = function collabSocket(io, socket) {
  const getRoom = (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        code: "",
        participants: new Map(),
        saveTimeout: null,
        codeLoaded: false,
      };
    }
    return rooms[roomId];
  };

  // 🔹 User joins a collaboration room
  socket.on("join-room", async (roomId, username) => {
    try {
      if (!roomId) return;

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username || "Guest";

      const room = getRoom(roomId);

      // Load saved code only once
      if (!room.codeLoaded) {
        try {
          const project = await Project.findById(roomId).select("code language");
          if (project) {
            room.code = project.code || "";
            room.language = project.language || "javascript";
          }
          room.codeLoaded = true;
        } catch (err) {
          console.error("Error loading code:", err);
        }
      }

      // Add participant
      room.participants.set(socket.id, socket.data.username);

      // Send current code to new user
      socket.emit("code-update", room.code);

      // Update participant list to everyone in the room
      io.to(roomId).emit(
        "participants-update",
        Array.from(room.participants.values())
      );

      console.log(`🟢 ${socket.data.username} joined ${roomId}`);
    } catch (err) {
      console.error("join-room error:", err);
    }
  });

  // 🔹 Code update (real-time sync + autosave)
  socket.on("code-change", (roomId, newCode) => {
    try {
      const room = getRoom(roomId);
      room.code = typeof newCode === "string" ? newCode : room.code;

      // Broadcast to others only (exclude sender)
      socket.to(roomId).emit("code-update", room.code);

      // Save throttle
      if (room.saveTimeout) clearTimeout(room.saveTimeout);
      room.saveTimeout = setTimeout(async () => {
        try {
          await Project.findByIdAndUpdate(roomId, { code: room.code });
          console.log("💾 Saved code for project", roomId);
        } catch (err) {
          console.error("DB save error:", err);
        }
      }, 2000);
    } catch (err) {
      console.error("code-change error:", err);
    }
  });

  // 🔹 Chat system — server forwards to others only
  socket.on("chat-message", (roomId, data) => {
    try {
      if (!roomId || !data) return;
      // Broadcast to others in room; sender already adds locally so they get a single message
      socket.to(roomId).emit("chat-update", data);
      // Optionally persist chat to DB here (not implemented for speed)
    } catch (err) {
      console.error("chat-message error:", err);
    }
  });

  // 🔹 Leave room
  socket.on("leave-room", (roomId) => {
    try {
      const username = socket.data.username;
      const room = rooms[roomId];

      if (room) {
        room.participants.delete(socket.id);

        io.to(roomId).emit(
          "participants-update",
          Array.from(room.participants.values())
        );

        if (room.participants.size === 0) {
          delete rooms[roomId];
          console.log(`🧹 Room ${roomId} deleted (empty)`);
        }
      }

      socket.leave(roomId);
      console.log(`🔴 ${username} left ${roomId}`);
    } catch (err) {
      console.error("leave-room error:", err);
    }
  });

  // 🔹 Disconnect handler
  socket.on("disconnect", () => {
    try {
      const roomId = socket.data.roomId;
      const username = socket.data.username;

      if (roomId && rooms[roomId]) {
        const room = rooms[roomId];
        room.participants.delete(socket.id);

        io.to(roomId).emit(
          "participants-update",
          Array.from(room.participants.values())
        );

        if (room.participants.size === 0) {
          delete rooms[roomId];
          console.log(`🧹 Room ${roomId} removed (empty)`);
        }
      }

      console.log(`🔴 Disconnected socket ${socket.id}`);
    } catch (err) {
      console.error("disconnect error:", err);
    }
  });
};
