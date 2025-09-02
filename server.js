const App = require("./src/app");

// Initialize and start the application
const app = new App();

try {
  app.start();
} catch (error) {
  console.error(" Failed to start server:", error);
  process.exit(1);
}
