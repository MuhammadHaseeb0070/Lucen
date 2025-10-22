// test-email.js
import dotenv from "dotenv";
dotenv.config({
    path: "../../.env",
});

import { sendOtpEmail } from "./mailer.js";

console.log("API Key:", process.env.BREVO_API_KEY + "...");

const test = async () => {
  await sendOtpEmail("muhammadhaseeb0070@gmail.com", 123456);
 };
test();
