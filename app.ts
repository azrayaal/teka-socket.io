import express from "express";
import { join } from "node:path";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import handleWaitingRoom from "./websockets/waitingroom";
import handleGameRoom from "./websockets/gameRoom";

const app = express();
const port = 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    allowedHeaders: "*",
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(cors()); // Enable CORS for all routes

app.get("/waitingroom", (req, res) => {
  res.sendFile(join(__dirname, "waitingroom.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(join(__dirname, "game.html"));
});

io.on("connection", (socket) => {
  handleWaitingRoom(socket, io);
  handleGameRoom(socket, io);
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
