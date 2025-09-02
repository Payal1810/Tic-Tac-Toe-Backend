const { Pool } = require("pg");
require("dotenv").config();

/**
 * PostgreSQL connection pool configuration
 * Uses environment variables for security and deployment flexibility
 */
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "TicTacToe",
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return error after 2s if no connection
});

//  Quick test if run directly
if (require.main === module) {
  pool.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.error("DB Connection Error:", err);
    } else {
      console.log("DB Connected successfully. Time:", res.rows[0].now);
    }
    pool.end();
  });
}

module.exports = pool;
