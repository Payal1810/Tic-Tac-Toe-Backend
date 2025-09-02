/**
 * Validation Middleware - Input validation and sanitization
 * Provides reusable validation functions for API endpoints and socket events
 */

class ValidationMiddleware {
  /**
   * Validate room ID format
   * @param {string} roomId - Room identifier
   * @returns {Object} Validation result
   */
  static validateRoomId(roomId) {
    if (!roomId) {
      return { isValid: false, error: "roomId is required" };
    }

    if (typeof roomId !== "string") {
      return { isValid: false, error: "roomId must be a string" };
    }

    if (roomId.trim().length === 0) {
      return { isValid: false, error: "roomId cannot be empty" };
    }

    if (roomId.length > 100) {
      return { isValid: false, error: "roomId too long (max 100 characters)" };
    }

    return { isValid: true };
  }

  /**
   * Validate user/player ID format
   * @param {string} userId - User identifier
   * @returns {Object} Validation result
   */
  static validateUserId(userId) {
    if (!userId) {
      return { isValid: false, error: "userId is required" };
    }

    if (typeof userId !== "string") {
      return { isValid: false, error: "userId must be a string" };
    }

    if (userId.trim().length === 0) {
      return { isValid: false, error: "userId cannot be empty" };
    }

    if (userId.length > 50) {
      return { isValid: false, error: "userId too long (max 50 characters)" };
    }

    return { isValid: true };
  }

  /**
   * Validate chat message content
   * @param {string} message - Message content
   * @returns {Object} Validation result with sanitized message
   */
  static validateMessage(message) {
    if (!message) {
      return { isValid: false, error: "message is required" };
    }

    if (typeof message !== "string") {
      return { isValid: false, error: "message must be a string" };
    }

    // Trim whitespace
    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return { isValid: false, error: "message cannot be empty" };
    }

    if (trimmedMessage.length > 1000) {
      return {
        isValid: false,
        error: "message too long (max 1000 characters)",
      };
    }

    // Basic XSS prevention - remove dangerous HTML tags
    const sanitizedMessage = this.sanitizeHtml(trimmedMessage);

    return {
      isValid: true,
      sanitizedMessage,
    };
  }

  /**
   * Validate game position (0-8 for TicTacToe)
   * @param {number} position - Board position
   * @returns {Object} Validation result
   */
  static validateGamePosition(position) {
    if (position === null || position === undefined) {
      return { isValid: false, error: "position is required" };
    }

    if (!Number.isInteger(position)) {
      return { isValid: false, error: "position must be an integer" };
    }

    if (position < 0 || position > 8) {
      return { isValid: false, error: "position must be between 0 and 8" };
    }

    return { isValid: true };
  }

  /**
   * Validate pagination parameters
   * @param {number} limit - Number of items to return
   * @param {number} offset - Number of items to skip
   * @returns {Object} Validation result with sanitized values
   */
  static validatePagination(limit, offset) {
    let sanitizedLimit = 50; // default
    let sanitizedOffset = 0; // default

    if (limit !== undefined) {
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return { isValid: false, error: "limit must be a positive integer" };
      }
      if (parsedLimit > 100) {
        return { isValid: false, error: "limit cannot exceed 100" };
      }
      sanitizedLimit = parsedLimit;
    }

    if (offset !== undefined) {
      const parsedOffset = parseInt(offset);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return {
          isValid: false,
          error: "offset must be a non-negative integer",
        };
      }
      sanitizedOffset = parsedOffset;
    }

    return {
      isValid: true,
      sanitizedLimit,
      sanitizedOffset,
    };
  }

  /**
   * Basic HTML sanitization to prevent XSS
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeHtml(input) {
    if (typeof input !== "string") return input;

    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Validate complete chat message data
   * @param {Object} data - Chat message data
   * @returns {Object} Validation result
   */
  static validateChatData(data) {
    const { roomId, userId, message } = data || {};

    const roomIdValidation = this.validateRoomId(roomId);
    if (!roomIdValidation.isValid) {
      return roomIdValidation;
    }

    const userIdValidation = this.validateUserId(userId);
    if (!userIdValidation.isValid) {
      return userIdValidation;
    }

    const messageValidation = this.validateMessage(message);
    if (!messageValidation.isValid) {
      return messageValidation;
    }

    return {
      isValid: true,
      sanitizedData: {
        roomId: roomId.trim(),
        userId: userId.trim(),
        message: messageValidation.sanitizedMessage,
      },
    };
  }

  /**
   * Validate complete game move data
   * @param {Object} data - Game move data
   * @returns {Object} Validation result
   */
  static validateGameMoveData(data) {
    const { roomId, playerId, position } = data || {};

    const roomIdValidation = this.validateRoomId(roomId);
    if (!roomIdValidation.isValid) {
      return roomIdValidation;
    }

    const playerIdValidation = this.validateUserId(playerId);
    if (!playerIdValidation.isValid) {
      return {
        isValid: false,
        error: playerIdValidation.error.replace("userId", "playerId"),
      };
    }

    const positionValidation = this.validateGamePosition(position);
    if (!positionValidation.isValid) {
      return positionValidation;
    }

    return {
      isValid: true,
      sanitizedData: {
        roomId: roomId.trim(),
        playerId: playerId.trim(),
        position,
      },
    };
  }

  /**
   * Rate limiting helper - simple in-memory rate limiting
   * @param {string} identifier - Client identifier (IP, socket ID, etc.)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} Whether request is allowed
   */
  static checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const now = Date.now();
    const clientData = this.rateLimitStore.get(identifier);

    if (!clientData) {
      this.rateLimitStore.set(identifier, {
        requests: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (now > clientData.resetTime) {
      // Reset the window
      this.rateLimitStore.set(identifier, {
        requests: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (clientData.requests >= maxRequests) {
      return false; // Rate limit exceeded
    }

    clientData.requests++;
    return true;
  }
}

module.exports = ValidationMiddleware;

