const ChatService = require("../services/chatService");

/**
 * Chat Socket Events Handler
 * Manages real-time chat functionality via Socket.IO
 */
class ChatEvents {
  static register(io, socket) {
    // Join chat room
    socket.on("chat:join", (data) => {
      try {
        const { roomId, userId } = data;

        if (!roomId || !userId) {
          socket.emit("chat:error", {
            message: "roomId and userId are required",
          });
          return;
        }

        socket.join(roomId.toString());
        socket.to(roomId.toString()).emit("chat:userJoined", {
          userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });

        socket.emit("chat:joined", { roomId, userId });
        console.log(`💬 User ${userId} joined chat room ${roomId}`);
      } catch (error) {
        console.error("Error joining chat room:", error);
        socket.emit("chat:error", { message: "Failed to join chat room" });
      }
    });

    // Send message
    socket.on("chat:send", async (data) => {
      try {
        const { roomId, userId, message } = data;

        if (!roomId || !userId || !message) {
          socket.emit("chat:error", {
            message: "roomId, userId, and message are required",
          });
          return;
        }

        const result = await ChatService.sendMessage(roomId, userId, message);

        if (result.success) {
          // Broadcast message to all users in the room
          const messageData = {
            ...result.data,
            socketId: socket.id,
          };

          io.to(roomId.toString()).emit("chat:receive", messageData);
          console.log(`💬 Message sent in room ${roomId} by ${userId}`);
        } else {
          socket.emit("chat:error", { message: result.error });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    // Get chat history
    socket.on("chat:getHistory", async (data) => {
      try {
        const { roomId, limit = 50, offset = 0 } = data || {};

        if (!roomId) {
          socket.emit("chat:error", { message: "roomId is required" });
          return;
        }

        const result = await ChatService.getChatHistory(roomId, limit, offset);

        if (result.success) {
          socket.emit("chat:history", {
            messages: result.data,
            count: result.count,
            roomId,
            limit,
            offset,
          });
        } else {
          socket.emit("chat:error", { message: result.error });
        }
      } catch (error) {
        console.error("Error getting chat history:", error);
        socket.emit("chat:error", { message: "Failed to get chat history" });
      }
    });

    // Leave chat room
    socket.on("chat:leave", (data) => {
      try {
        const { roomId, userId } = data;

        if (!roomId) {
          socket.emit("chat:error", { message: "roomId is required" });
          return;
        }

        socket.leave(roomId.toString());
        socket.to(roomId.toString()).emit("chat:userLeft", {
          userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });

        socket.emit("chat:left", { roomId, userId });
        console.log(`💬 User ${userId} left chat room ${roomId}`);
      } catch (error) {
        console.error("Error leaving chat room:", error);
        socket.emit("chat:error", { message: "Failed to leave chat room" });
      }
    });

    // Typing indicators
    socket.on("chat:typing", (data) => {
      try {
        const { roomId, userId, isTyping } = data;

        if (!roomId || !userId) {
          return;
        }

        socket.to(roomId.toString()).emit("chat:userTyping", {
          userId,
          isTyping: Boolean(isTyping),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error handling typing indicator:", error);
      }
    });
  }
}

module.exports = ChatEvents;
