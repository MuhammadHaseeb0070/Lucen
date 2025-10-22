import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.js";
import userRoute from "./api/v1/routes/userRoute.js";
import chatRoute from "./api/v1/routes/chatRoute.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());


app.use("/api/v1/auth",userRoute);
app.use("/api/v1/chats", chatRoute);




app.get('/healthcheck' ,(req,res)=>{
    res.status(200).json({
        message: "server is up and running!"
})
});

app.use(errorHandler);


export {app};