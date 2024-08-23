import express from 'express';
import http from 'http';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import router from './routes/user.js';
import admrouter from './routes/admin.js';
import premrouter from './routes/premium.js';
import socketManager from './socket/socket.js';  
import './middleware/cron.js'

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static('uploads'));

// const connect = mongoose.connect('mongodb://localhost:27017/VOYAGE');
const connect = mongoose.connect(`mongodb+srv://voyagedb:${process.env.dbPassAtlas}@voyagecluster.8toyd.mongodb.net/?retryWrites=true&w=majority&appName=voyageCluster`)

connect.then(() => {
  console.log('Database connected successfully');
}).catch((err) => {
  console.log('Error connecting to db: ' + err);
});

app.use(router);
app.use(admrouter);
app.use(premrouter);

app.get('/test', (req, res) => {
  const data = {
    message: 'Hello from the backend!',
    timestamp: new Date().toISOString(),
  };
  res.json(data);
});

socketManager(server);

server.listen(3001, () => {
  console.log('Server started on http://localhost:3001');
});
