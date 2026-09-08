import { Server } from "socket.io";
import { ENV } from "./env.js";

let io = null;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ENV.CLIENT_URL || true,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    console.log(`⚡ [Socket.io] Client connected: ${socket.id}`);

    // Join a specific interview / coding session room
    socket.on("join_session", ({ sessionId, user }) => {
      if (!sessionId) return;
      const room = `session:${sessionId}`;
      socket.join(room);
      socket.data.sessionId = sessionId;
      socket.data.user = user;

      console.log(`👤 User ${user?.name || socket.id} joined room ${room}`);

      // Notify other participants in the room
      socket.to(room).emit("user_joined", {
        user,
        timestamp: new Date().toISOString(),
      });
    });

    // Send a message within a session room
    socket.on("send_message", ({ sessionId, text, user }) => {
      if (!sessionId || !text?.trim()) return;

      const room = `session:${sessionId}`;
      const message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sessionId,
        sender: user || { id: socket.id, name: "Anonymous" },
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      // Broadcast message to everyone in the room (including sender)
      io.to(room).emit("receive_message", message);
    });

    // Typing indicators
    socket.on("typing", ({ sessionId, user }) => {
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit("user_typing", {
        user,
        sessionId,
      });
    });

    socket.on("stop_typing", ({ sessionId, user }) => {
      if (!sessionId) return;
      socket.to(`session:${sessionId}`).emit("user_stop_typing", {
        user,
        sessionId,
      });
    });

    // Leave a session room
    socket.on("leave_session", ({ sessionId, user }) => {
      if (!sessionId) return;
      const room = `session:${sessionId}`;
      socket.leave(room);
      socket.to(room).emit("user_left", {
        user,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
      if (socket.data.sessionId) {
        const room = `session:${socket.data.sessionId}`;
        socket.to(room).emit("user_left", {
          user: socket.data.user,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
