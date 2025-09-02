const ChatEvents = require("./chatEvents");


/**
 * Socket Handler - Central socket event management
 * Organizes and initializes all socket event handlers
 */
class SocketHandler {
  /**
   * Initialize socket.io server with all event handlers
   * @param {Object} io - Socket.IO server instance
   */
  static initialize(io) {
    console.log("🔌 Initializing Socket.IO handlers...");

    io.on("connection", (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Register connection events
      this.registerConnectionEvents(socket);

      // Register chat events
      ChatEvents.register(io, socket);



      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
        this.handleDisconnection(socket, reason);
      });

      // Handle socket errors
      socket.on("error", (error) => {
        console.error(`🚨 Socket error for ${socket.id}:`, error);
      });
    });

    // Handle server-level socket errors
    io.on("error", (error) => {
      console.error("🚨 Socket.IO server error:", error);
    });

    console.log("✅ Socket.IO handlers initialized");
  }

  /**
   * Register basic connection events
   * @param {Object} socket - Socket instance
   */
  static registerConnectionEvents(socket) {
    // Ping/pong for connection testing
    socket.on("ping", (data, callback) => {
      const response = {
        ok: true,
        echo: data || null,
        timestamp: new Date().toISOString(),
        socketId: socket.id,
      };

      if (callback && typeof callback === "function") {
        callback(response);
      } else {
        socket.emit("pong", response);
      }
    });

    // Room management
    socket.on("joinRoom", (data) => {
      try {
        const { roomId, userId } = data;

        if (!roomId) {
          socket.emit("error", { message: "roomId is required" });
          return;
        }

        socket.join(roomId.toString());
        console.log(`👤 User ${userId || "anonymous"} joined room ${roomId}`);

        socket.emit("roomJoined", { roomId, userId });
        socket
          .to(roomId.toString())
          .emit("userJoinedRoom", { userId, socketId: socket.id });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leaveRoom", (data) => {
      try {
        const { roomId, userId } = data;

        if (!roomId) {
          socket.emit("error", { message: "roomId is required" });
          return;
        }

        socket.leave(roomId.toString());
        console.log(`👤 User ${userId || "anonymous"} left room ${roomId}`);

        socket.emit("roomLeft", { roomId, userId });
        socket
          .to(roomId.toString())
          .emit("userLeftRoom", { userId, socketId: socket.id });
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("error", { message: "Failed to leave room" });
      }
    });
  }

  /**
   * Handle client disconnection cleanup
   * @param {Object} socket - Socket instance
   * @param {string} reason - Disconnection reason
   */
  static handleDisconnection(socket, reason) {
    // Cleanup logic can be added here
    // For example: notify rooms about user disconnection

    // Get all rooms the socket was in
    const rooms = Array.from(socket.rooms);
    rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit("userDisconnected", {
          socketId: socket.id,
          reason,
        });
      }
    });
  }

  /**
   * Broadcast to all clients
   * @param {Object} io - Socket.IO server instance
   * @param {string} event - Event name
   * @param {Object} data - Data to broadcast
   */
  static broadcast(io, event, data) {
    io.emit(event, data);
  }

  /**
   * Broadcast to specific room
   * @param {Object} io - Socket.IO server instance
   * @param {string} roomId - Room identifier
   * @param {string} event - Event name
   * @param {Object} data - Data to broadcast
   */
  static broadcastToRoom(io, roomId, event, data) {
    io.to(roomId.toString()).emit(event, data);
  }
}

module.exports = SocketHandler;

