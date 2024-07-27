import express, { Router } from "express";
const app = express()
import cors from "cors"
import { fileURLToPath } from 'url';
import path from "path"
import router from "./routes/user.js";
import admrouter from "./routes/admin.js"
import premrouter from "./routes/premium.js";
import mongoose from "mongoose";
import dotenv from "dotenv"
import bodyParser from "body-parser";

app.use(express.json())
dotenv.config()

app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); 

const connect = mongoose.connect('mongodb://localhost:27017/VOYAGE')

connect.then(()=>{
    console.log("Database connected successfully");
}).catch((err)=>{
    console.log("Error connectiong with db"+err);
})

app.use(cors());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(router)
app.use(admrouter)
app.use(premrouter)
app.use('/uploads', express.static('uploads'));



app.get("/test",(req,res)=>{
    const data = {
        message: 'Hello from the backend!',
        timestamp: new Date().toISOString()
      };
      res.json(data);
})

app.listen(3001)
console.log("Server started on http://localhost:3001");