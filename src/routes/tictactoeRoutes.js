const url = require("url");
const chatController = require("../controllers/chatController");


class TicTacToeRoutes {
  /**
   * Handle incoming HTTP requests for TicTacToe
   * @param {Object} req - HTTP request object
   * @param {Object} res - HTTP response object
   */
  static async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;

    try {

      // TicTacToe Chat Routes
      if (pathname.startsWith("/tictactoe/chat/") && method === "POST") {
        const roomId = pathname.split("/")[3];
        req.params = { roomId };
        // Extract message from body and add roomId
        return await this.handlePostRequest(req, res, (req, res) => {
          req.body.roomId = roomId; // Add roomId to request body
          return chatController.postMessage(req, res);
        });
      }

      if (pathname.startsWith("/tictactoe/chat/") && method === "GET") {
        const roomId = pathname.split("/")[3];
        req.params = { roomId };
        return await chatController.getMessages(req, res);
      }


      // Route not found
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "TicTacToe endpoint not found",
          hint: "Try POST /tictactoe/create-room to start a new game",
        })
      );
    } catch (error) {
      console.error("TicTacToe Route Error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }

  /**
   * Handle POST requests with body parsing
   * @param {Object} req - HTTP request object
   * @param {Object} res - HTTP response object
   * @param {Function} handler - Controller handler function
   */
  static async handlePostRequest(req, res, handler) {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();

      // Prevent large payloads (DoS protection)
      if (body.length > 1e6) {
        // 1MB limit
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Payload too large" }));
        return;
      }
    });

    req.on("end", async () => {
      try {
        // Parse JSON body
        if (body) {
          req.body = JSON.parse(body);
        } else {
          req.body = {};
        }

        // Call the controller handler
        await handler(req, res);
      } catch (error) {
        if (error instanceof SyntaxError) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON format" }));
        } else {
          console.error("Request handling error:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bad request" }));
    });
  }
}

module.exports = TicTacToeRoutes;
