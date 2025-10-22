import express from "express";
import { signUp, verifyOtp, login, resendOtp, refreshTokenController, forgottenPassword, resetPassword } from "../controllers/auth.controller.js";
import { verifyToken } from "../../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const router = express.Router();

router.post('/signup', asyncHandler(signUp));
router.post('/verify-otp', asyncHandler(verifyOtp));
router.post('/login', asyncHandler(login));
router.post('/resend-otp', asyncHandler(resendOtp));
router.post('/refresh-token', asyncHandler(refreshTokenController));
router.post('/forgotten-password', asyncHandler(forgottenPassword));
router.post('/reset-password', asyncHandler(resetPassword));

router.get("/protected", verifyToken, (req, res) => {
    res.json({
      success: true,
      message: "You have access to this protected route!",
      user: req.user, // this contains id, email, role, etc.
    });
  });
export default router;