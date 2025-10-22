import pool from "../config/db.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export async function DB_createUser(name ,email , hashedPassword, role = 'customer' ,otp, otpExpiresAt, is_verified = false) {
    const result =await pool.query(
        `INSERT INTO users (name, email, password, role, otp, otp_expires_at, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6 ,$7)
         RETURNING id, name, email, role, created_at`,
        [name, email, hashedPassword, role || "customer", otp, otpExpiresAt, is_verified]
      );
        return result.rows[0]
}


export async function DB_verifyUser(email) {
    const result = await pool.query(`UPDATE users SET is_verified = true WHERE email = $1 RETURNING id,name,email,role ,created_at`, [email]);
    return result.rows[0]
}


export async function DB_updatePasswordResetToken(email,passwordResetToken,passwordResetExpiresAt) {
    const result = await pool.query(`UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2 WHERE email = $3 RETURNING id,name,email,role ,created_at`, [passwordResetToken,passwordResetExpiresAt,email]);
    return result.rows[0]
}

export async function DB_findUser(email) {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if(result.rows.length === 0) {
        return null
    }
    return result.rows[0]
 
}
export async function DB_findUserById(id) {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    if(result.rows.length === 0) {
        return null
    }
    return result.rows[0]
 
}
export async function DB_allUser() {
    const result = await pool.query(`SELECT * FROM users`);
    
    return result.rows
 
}
export async function DB_updateOtp(email,otp,otpExpiresAt) {
    const result = await pool.query(`UPDATE users SET otp = $1, otp_expires_at = $2 WHERE email = $3 RETURNING id,name,email,role ,created_at`, [otp,otpExpiresAt,email]);
    return result.rows[0]
}

export async function DB_saveRefreshToken(userId,refreshToken,refreshTokenExpiresAt) {
    const result = await pool.query(`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id,user_id,token,expires_at`, [userId,refreshToken,refreshTokenExpiresAt]);
    return result.rows[0]
}

export async function DB_findRefreshToken(refreshToken) {
    const result = await pool.query(`SELECT * FROM refresh_tokens WHERE token = $1`, [refreshToken]);
    return result.rows[0]
}

export async function DB_deleteRefreshToken(userId) {
    const result = await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
    return result.rowCount
}

export async function DB_findUserByPasswordResetToken(passwordResetToken) {
    const result = await pool.query(`SELECT * FROM users WHERE password_reset_token = $1`, [passwordResetToken]);
    if(result.rows.length === 0) {
        return null
    }
    return result.rows[0]
}
export async function DB_updatePassword(userId,hashedPassword) {
    const result = await pool.query(`UPDATE users SET password = $1 WHERE id = $2 RETURNING id,name,email,role ,created_at`, [hashedPassword,userId]);
    return result.rows[0]
}
export async function DB_deletePasswordResetToken(userId) {
    const result = await pool.query(`UPDATE users SET password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = $1 RETURNING id,name,email,role ,created_at`, [userId]);
    return result.rows[0]
}