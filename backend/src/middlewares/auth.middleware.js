import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import dotenv from "dotenv";
dotenv.config({
  path: "././.env",
});

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token in header");
      throw new ApiError(401, "Unauthorized");
    }

    const authToken = authHeader.split(" ")[1];
    if (!authToken) {
      console.log("❌ No token after Bearer");
      throw new ApiError(401, "Unauthorized");
    }

    console.log("🔍 Verifying token with secret:", process.env.ACCESS_TOKEN_SECRET ? "Secret exists" : "Secret missing");
    console.log("🔍 Token to verify:", authToken.substring(0, 20) + "...");
    
    const decodedToken = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET);
    console.log("✅ Token verified successfully, user:", decodedToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    
    // Handle JWT expiration specifically
    if (error.name === 'TokenExpiredError') {
      console.log("🔄 Token expired, should trigger refresh");
      return next(new ApiError(401, "Token expired"));
    }
    
    // Handle other JWT errors
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, "Invalid token"));
    }
    
    next(error);
  }
};
