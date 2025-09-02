const pool = require("../config/db");

const saveMessage = async (roomId, senderId, content) => {
  const result = await pool.query(
    `INSERT INTO chat_message (room_id, sender_id, content, created_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
    [roomId, senderId, content]
  );
  return result.rows[0];
};

const getMessagesByRoom = async (roomId, limit = 50, offset = 0) => {
  const result = await pool.query(
    `SELECT id, room_id, sender_id, content, created_at 
     FROM chat_message 
     WHERE room_id = $1 
     ORDER BY created_at ASC 
     LIMIT $2 OFFSET $3`,
    [roomId, limit, offset]
  );
  return result.rows;
};

module.exports = { saveMessage, getMessagesByRoom };
