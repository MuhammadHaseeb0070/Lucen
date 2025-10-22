// utils/mailer.js
import Brevo from "@getbrevo/brevo";
import dotenv from "dotenv";
dotenv.config({
    path: "../../.env",
});

const brevo = new Brevo.TransactionalEmailsApi();
brevo.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);


export const sendResetPasswordEmail = async (toEmail, resetPasswordUrl) => {
  try {
    const emailData = {
      sender: { name: "RickShawWala", email: "nastymaverick63@gmail.com" },
      to: [{ email: toEmail }],
      subject: "Reset Password",
      htmlContent: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Reset Password</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetPasswordUrl}">${resetPasswordUrl}</a>
        </div>
      `,
    };
    const response = await brevo.sendTransacEmail(emailData);
    console.log("✅ Reset password email sent successfully:", response);
    return response;
  }
  catch (error) {
    console.error("❌ Failed to send reset password email:", error.response?.text || error);
    throw error;
  }
};

export const sendOtpEmail = async (toEmail, otp) => {
  try {
    const emailData = {
      sender: { name: "RickShawWala", email: "nastymaverick63@gmail.com" },
      to: [{ email: toEmail }],
      subject: "Your OTP Code",
      htmlContent: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    };

    const response = await brevo.sendTransacEmail(emailData);
    console.log("✅ OTP email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error.response?.text || error);
    throw error;
  }
};
