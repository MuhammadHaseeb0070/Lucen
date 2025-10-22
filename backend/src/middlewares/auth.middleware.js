import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({
  path: "././.env",
});

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new APIError(401, "Unauthorized");
    }

    const authToken = authHeader.split(" ")[1];
    if (!authToken) {
      throw new APIError(401, "Unauthorized");
    }
    const decodedToken = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};
