const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const tictactoeRoutes = require("./routes/tictactoeRoutes");
const socketHandler = require("./socket/socketHandler");

class App {
  constructor() {
    this.server = null;
    this.io = null;
    this.port = process.env.PORT || 5000;
  }

  createServer() {
    this.server = http.createServer(async (req, res) => {
      // Set CORS headers
      this.setCorsHeaders(res);

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }

      // Route TicTacToe requests
      if (req.url.startsWith("/tictactoe")) {
        return tictactoeRoutes.handleRequest(req, res);
      }

      // Health check endpoint
      if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "1.0.0",
          })
        );
      }

      // Default 404 response
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Endpoint not found" }));
    });

    return this.server;
  }

  /**
   * Set CORS headers for cross-origin requests
   */
  setCorsHeaders(res) {
    const corsOrigin = process.env.CORS_ORIGIN || "*";
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  /**
   * Setup Socket.IO server
   */
  setupSocketIO() {
    const corsOrigin = process.env.SOCKET_CORS_ORIGIN || "*";

    this.io = new Server(this.server, {
      cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
        credentials: true,
      },
      // Production optimizations
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6, // 1MB
    });

    // Register socket event handlers
    socketHandler.initialize(this.io);

    return this.io;
  }

  start() {
    this.createServer();
    this.setupSocketIO();

    this.server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
    });

    // Graceful shutdown handling
    this.setupGracefulShutdown();

    return this.server;
  }

  /**
   * Setup graceful shutdown for production deployments
   */
  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      console.log(` Received ${signal}. Starting graceful shutdown...`);

      this.server.close(() => {
        console.log("✅ HTTP server closed.");

        if (this.io) {
          this.io.close(() => {
            console.log("✅ Socket.IO server closed.");
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 30000);
    };
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }
}

module.exports = App;
