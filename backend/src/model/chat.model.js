import pool from '../config/db.js';

// Create a new chat
export const DB_createChat = async (userId, title) => {
  const query = `
    INSERT INTO chats (user_id, title)
    VALUES ($1, $2)
    RETURNING id, user_id, title, created_at
  `;
  const values = [userId, title];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Find all chats for a user
export const DB_findChatsByUserId = async (userId) => {
  const query = `
    SELECT id, title, created_at
    FROM chats
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const values = [userId];
  
  const result = await pool.query(query, values);
  return result.rows;
};

// Find all messages for a chat
export const DB_findMessagesByChatId = async (chatId) => {
  const query = `
    SELECT id, role, content, created_at
    FROM messages
    WHERE chat_id = $1 AND is_deleted = false
    ORDER BY created_at ASC
  `;
  const values = [chatId];
  
  const result = await pool.query(query, values);
  return result.rows;
};

// Create a new message
export const DB_createMessage = async (chatId, role, content) => {
  const query = `
    INSERT INTO messages (chat_id, role, content)
    VALUES ($1, $2, $3)
    RETURNING id, chat_id, role, content, created_at
  `;
  const values = [chatId, role, content];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};
