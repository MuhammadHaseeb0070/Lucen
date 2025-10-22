import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { DB_deleteRefreshToken, DB_findRefreshToken, DB_findUser, DB_findUserById, DB_saveRefreshToken, DB_findUserByPasswordResetToken, DB_updatePassword, DB_deletePasswordResetToken, DB_updatePasswordResetToken, DB_deleteRefreshTokenByToken } from "../../../model/user.model.js";
import { DB_updateOtp } from "../../../model/user.model.js";
import { DB_createUser } from "../../../model/user.model.js"
import { DB_verifyUser } from "../../../model/user.model.js";
import { sendOtpEmail, sendResetPasswordEmail } from "../../../utils/mailer.js";

export const signUp= async(req, res, next)=>{
    try {
        console.log("🚀 Signup request started");
        const {name , email , password , role} = req.body;
        console.log("📝 Request body received:", {name, email, role});
        
        if(!name || !email || !password ){
            console.log("❌ Missing required fields");
            throw new ApiError(400,"All fields are required");
        }

        console.log("🔍 Checking if user already exists...");
        const existingUser = await DB_findUser(email);
        if(existingUser){
            if(existingUser.is_verified){
                throw new ApiError(400,"User already exists");
            }else{
              
            }
        }
        console.log("✅ User doesn't exist, proceeding...");

        console.log("🔐 Hashing password...");
        const hashedPassword = await bcrypt.hash(password,10);
        console.log("✅ Password hashed successfully");

        console.log("🎲 Generating OTP...");
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 
        console.log("✅ OTP generated:", otp);

        console.log("💾 Creating user in database...");
        const user  = await DB_createUser(name,email,hashedPassword,role,otp,otpExpiresAt,false);
        console.log("✅ User created in database:", user);

        console.log("📧 Sending OTP email...");
        await sendOtpEmail(email,otp);
        console.log("✅ OTP email sent successfully");

        console.log("🎉 Sending success response...");
        res.status(201).json({
            success:true,
            message:"User Registered Successfully Please Verify Your Email",
            user,
        })
        console.log("✅ Response sent successfully");

    } catch (error) {
        console.log("❌ Error in signup:", error);
        next(error);
    }
}


export const verifyOtp=  async(req, res, next)=>{
    try {
        const {email , otp} = req.body;
        if(!email || !otp){
            throw new ApiError(400,"OTP is Required");
        }

        const user = await DB_findUser(email);


        if(!user){
            throw new ApiError(400,"Please register first before verifying OTP");
        }

        if(user.is_verified){
            throw new ApiError(400,"User is already verified");
        }
        if(user.otp !== otp){
            throw new ApiError(400,"Invalid OTP");
        }
        if(user.otp_expires_at < new Date()){
            throw new ApiError(400,"OTP has expired");
        }
        
        const updatedUser = await DB_verifyUser(email );

        res.status(200).json({
            success:true,
            message:"OTP verified successfully",
            user:updatedUser
        })

        
    } catch (error) {
        next(error);
    }
}

export const resendOtp= async(req, res, next)=>{
    try {
        const {email} = req.body;
        if(!email){
            throw new ApiError(400,"Register again");
        }

        const user = await DB_findUser(email);

        if(!user){
            throw new ApiError(400,"User not found");
        }

        if(user.is_verified){
            throw new ApiError(400,"User is already verified");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        const updatedUser = await DB_updateOtp(email,otp,otpExpiresAt);
        if(!updatedUser){
            throw new ApiError(400,"Failed to update OTP");
        }
        await sendOtpEmail(email,otp);

        res.status(200).json({
            success:true,
            message:"OTP sent successfully",
            user:updatedUser
        })

    } catch (error) {
        next(error);
    }
}

export const login= async(req, res, next)=>{
    try {
        const {email , password} = req.body;

        if(!email || !password){
            throw  new ApiError(400,"Email and Password are required");
        }

        const user = await DB_findUser(email);

        if(!user){
            throw new ApiError(400,"User not found");
        }

        if(!user.is_verified){
            throw new ApiError(400,"User is not verified ,Register Again");
        }
        
        const isPasswordCorrect = await bcrypt.compare(password,user.password);

        if(!isPasswordCorrect){
            throw new ApiError(400,"Invalid Password");
        }
        const token = jwt.sign({id:user.id, email: user.email , role:user.role},process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY, algorithm: 'HS256'});

        const refreshToken = jwt.sign({id:user.id},process.env.REFRESH_TOKEN_SECRET,{expiresIn:process.env.REFRESH_TOKEN_EXPIRY, algorithm: 'HS256'});
        const refreshTokenExpiresAt = new Date(Date.now() + parseInt(process.env.REFRESH_TOKEN_EXPIRY.slice(0, -1)) * 24 * 60 * 60 * 1000);
        await DB_deleteRefreshToken(user.id);
        await DB_saveRefreshToken(user.id,refreshToken,refreshTokenExpiresAt);

        res.status(200).json({
            success:true,
            message:"Login Successfully",
            user,
            accessToken:token,
            refreshToken:refreshToken
        })
    } catch (error) {
        next(error);
    }
}

export const refreshTokenController=async (req,res,next)=>{
    try {
        
        const {refreshToken} = req.body;
        if(!refreshToken){
            throw new ApiError(400,"Refresh Token is required");
        }
        const savedRefreshToken = await DB_findRefreshToken(refreshToken);

        if(!savedRefreshToken){
            throw new ApiError(400,"Invalid Refresh Token");
        }

        const decodedToken= jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        if(!decodedToken){
            throw new ApiError(400,"Invalid Refresh Token");
        }
        const user = await DB_findUserById(decodedToken.id);
        if(!user){
            throw new ApiError(400,"User not found");
        }
        const token = jwt.sign({id:user.id, email: user.email , role:user.role},process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY, algorithm: 'HS256'});
     
        res.status(200).json({
            success:true,
            message:"Access Token generated successfully",
            user,
            accessToken:token
        })



    } catch (error) {
        next(error);
    }
}

export const forgottenPassword= async(req,res,next)=>{
    try {
        const {email}=req.body;

        const user=await DB_findUser(email);
        if(!user){
            throw new ApiError(400,"User not found");
        }

        const plainToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await DB_updatePasswordResetToken(email,hashedToken,expiresAt);

        const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password?token=${plainToken}`;

        await sendResetPasswordEmail(email,resetPasswordUrl);
        res.status(200).json(new ApiResponse(200,"If User Existed then RESET PASSWORD LINK SENT TO EMAIL"));

    } catch (error) {
        
    }
}
export const resetPassword= async(req,res,next)=>{
    try {
        const {token,newPassword}=req.body;

        if(!token || !newPassword){
            throw new ApiError(400,"Token and New Password are required");
        }
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await DB_findUserByPasswordResetToken(hashedToken);
        if(!user){
            throw new ApiError(400,"Invalid Token");
        }
        if(user.password_reset_expires_at < new Date()){
            throw new ApiError(400,"Token has expired");
        }
        const hashedPassword = await bcrypt.hash(newPassword,10);
        await DB_updatePassword(user.id,hashedPassword);
        await DB_deletePasswordResetToken(user.id);
        res.status(200).json(new ApiResponse(200,"Password reset successfully"));



    } catch (error) {
        next(error);
    }
}

export const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new ApiError(400, 'Refresh token is required');
        }

        await DB_deleteRefreshTokenByToken(refreshToken);

        return res.status(200).json(
            new ApiResponse(200, null, 'Logout successful')
        );
    } catch (error) {
        next(error);
    }
};