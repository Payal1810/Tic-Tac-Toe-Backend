const chatModel = require("../models/chatModel");

/**
 * Chat Service - Business logic for chat operations
 * Handles message sending, retrieval, and validation
 */
class ChatService {
  /**
   * Send a message to a chat room
   * @param {string} roomId - Room identifier
   * @param {string} senderId - Sender's user ID
   * @param {string} content - Message content
   * @returns {Object} Service response with message data
   */
  static async sendMessage(roomId, senderId, content) {
    try {
      // Validate input
      if (!roomId || !senderId || !content) {
        return {
          success: false,
          error: "roomId, senderId, and content are required",
        };
      }

      // Trim and validate content length
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        return {
          success: false,
          error: "Message content cannot be empty",
        };
      }

      if (trimmedContent.length > 1000) {
        return {
          success: false,
          error: "Message content too long (max 1000 characters)",
        };
      }

      const message = await chatModel.saveMessage(
        roomId,
        senderId,
        trimmedContent
      );

      return {
        success: true,
        data: message,
        message: "Message sent successfully",
      };
    } catch (error) {
      console.error("Error in sendMessage:", error);
      return {
        success: false,
        error: "Failed to send message",
      };
    }
  }

  /**
   * Get chat history for a room
   * @param {string} roomId - Room identifier
   * @param {number} limit - Maximum number of messages to retrieve
   * @param {number} offset - Number of messages to skip
   * @returns {Object} Service response with messages array
   */
  static async getChatHistory(roomId, limit = 50, offset = 0) {
    try {
      if (!roomId) {
        return {
          success: false,
          error: "roomId is required",
        };
      }

      const messages = await chatModel.getMessagesByRoom(roomId, limit, offset);

      return {
        success: true,
        data: messages,
        count: messages.length,
      };
    } catch (error) {
      console.error("Error in getChatHistory:", error);
      return {
        success: false,
        error: "Failed to retrieve chat history",
      };
    }
  }

  /**
   * Fetch chat history (alias for backward compatibility)
   */
  static async fetchChatHistory(roomId) {
    const result = await this.getChatHistory(roomId);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }
}

module.exports = ChatService;
