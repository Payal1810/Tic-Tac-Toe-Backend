const ChatService = require("../services/chatService");

/**
 * Chat Controller - HTTP endpoints for chat operations
 * Handles REST API requests for messaging
 */
class ChatController {
  /**
   * Send a message to a chat room
   * POST /api/chat
   */
  static async postMessage(req, res) {
    try {
      const { roomId, senderId, content } = req.body;

      const result = await ChatService.sendMessage(roomId, senderId, content);

      if (result.success) {
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            data: result.data,
            message: result.message,
          })
        );
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: result.error,
          })
        );
      }
    } catch (error) {
      console.error("Error in postMessage controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Failed to save message",
        })
      );
    }
  }

  /**
   * Get messages for a chat room
   */
  static async getMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { limit, offset } = req.query || {};

      const result = await ChatService.getChatHistory(
        roomId,
        limit ? parseInt(limit) : undefined,
        offset ? parseInt(offset) : undefined
      );

      if (result.success) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            data: result.data,
            count: result.count,
          })
        );
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: result.error,
          })
        );
      }
    } catch (error) {
      console.error("Error in getMessages controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Failed to fetch messages",
        })
      );
    }
  }
}

module.exports = ChatController;
