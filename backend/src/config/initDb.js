import pool from "./db.js";

export async function initDb() {
  try {
    // 1. Enable the UUID extension
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    console.log("✅ UUID extension is ready.");

    // 2. Create the 'users' table (with modifications)
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL, 
            email VARCHAR(100) NOT NULL UNIQUE,
            password TEXT, -- CHANGED: Now nullable
            auth_provider VARCHAR(50) NOT NULL DEFAULT 'email', -- NEW: Tracks login method
            role VARCHAR(50) DEFAULT 'customer',
            is_verified BOOLEAN DEFAULT false,
            otp VARCHAR(6),
            otp_expires_at TIMESTAMP,
            password_reset_token TEXT,
            password_reset_expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );`);
    console.log("✅ User table is ready (Google Auth compatible).");

    // 3. Create the 'refresh_tokens' table
    await pool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );`);
    console.log("✅ Refresh Tokens table is ready.");
  } catch (error) {
    console.error("❌ Failed to initialize database tables:", error);
    throw error;
  }
}