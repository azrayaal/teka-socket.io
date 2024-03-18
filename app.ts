import express from "express";
import { join } from "node:path";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import Axios from "axios";

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
// var io = require('socket.io').listen(server);
app.use(cors()); // Enable CORS for all routes
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.get("/tictactoe", (req, res) => {
  res.sendFile(join(__dirname, "tictactoe.html"));
});

app.get("/waitingroom", (req, res) => {
  res.sendFile(join(__dirname, "waitingroom.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(join(__dirname, "game.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(join(__dirname, "profile.html"));
});

const waitingRoom = "waitingRoom";
const gameRoom = "gameRoom";
let usersInWaitingRoom: any[] = [];
let countdownInterval: any;
let seconds = 30;

////////////////////// COUNTDOWN //////////////////////
function startCountdown() {
  countdownInterval = setInterval(() => {
    seconds--;
    io.emit("countdown", seconds);
    if (seconds === -1) {
      clearInterval(countdownInterval);
      seconds = 30;
    }
    // Emit countdown value to all clients
    io.emit("countdown", seconds);
  }, 1000);
}
//////////////////////////////////////////////////////

io.on("connection", (socket) => {
  ////////////////////// WAITING ROOM //////////////////////
  let player = {
    name: "", // get from client
    id: socket.id,
  };

  socket.join(waitingRoom);
  console.log("Room", waitingRoom, "created");

  // usersInWaitingRoom.push(socket.id);
  usersInWaitingRoom.push(player);
  io.to(waitingRoom).emit("usersCount", usersInWaitingRoom.length);
  socket.emit("usersInWaitingRoom", usersInWaitingRoom);

  console.log(usersInWaitingRoom.length);
  console.log(usersInWaitingRoom);

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    // Remove user from waiting room
    const index = usersInWaitingRoom.findIndex((user) => user.id === socket.id);

    console.log("index", index);
    if (index !== -1) {
      usersInWaitingRoom.splice(index, 1);
    }
    // update users in waiting room after leave
    io.to(waitingRoom).emit("usersCount", usersInWaitingRoom.length);

    // Terminate waiting room if it becomes empty
    if (index === 0) {
      seconds = 30;
      clearInterval(countdownInterval);
      console.log("Room", waitingRoom, "terminated.");
    }
  });
  // Start countdown when the first user joins the waiting room
  if (usersInWaitingRoom.length === 1) {
    startCountdown();
    console.log("start counting");
  }
  // Move users to game room when there are four users
  if (usersInWaitingRoom.length === 4) {
    io.to(waitingRoom).emit("moveTogameRoom");

    usersInWaitingRoom.forEach((user) => {
      const socket = io.sockets.sockets.get(user.id);
      console.log(user.id);
      // Check if the socket exists
      if (socket) {
        // Leave the waiting room
        socket.leave(waitingRoom);
        // Join the game room
        socket.join(gameRoom);
      }
    });
    usersInWaitingRoom = [];
  }
  ////////////////////// END OF WAITING ROOM //////////////////////
  ////////////////////// GAME ROOM //////////////////////////////

  const getQuestion = async () => {
    try {
      const res = await Axios.get("http://localhost:8080/api/v1/quiz");
      let quiz = res.data;
      const getRandomQuiz = (quiz: any) => {
        const randomIndex = Math.floor(Math.random() * quiz.length);
        return quiz[randomIndex];
      };
      const randomQuizQuestion = getRandomQuiz(quiz);

      // socket.emit("game", randomQuizQuestion);

      function shuffleArray(array: any) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      const options = [
        randomQuizQuestion.answer,
        randomQuizQuestion.option1,
        randomQuizQuestion.option2,
        randomQuizQuestion.option3,
      ];

      shuffleArray(options);
      let question = randomQuizQuestion.question;

      io.to(gameRoom).emit("game", { question, options });
    } catch (error) {
      // console.log("error");
    }
  };
  getQuestion();

  socket.emit("socketId", socket.id);

  ////////////////////// END OF GAME ROOM //////////////////////
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// ///////////////// chat message //////////
// io.on("connection", (socket) => {
//   socket.on("chat message", (msg) => {
//     io.emit("chat message", msg);
//   });

//   socket.emit("test emit");

//   socket.on("world", (arg) => {
//     console.log(arg);
//   });

//   socket.emit("hello", "world");
// });

//////////////////////////////// tictactoe //////////////////////
// let arr=[]
// let playingArray=[]

// io.on("connection",(socket)=>{

//   socket.on("find",(e)=>{

//       if(e.name!=null){

//           arr.push(e.name)

//           if(arr.length>=2){
//               let p1obj={
//                   p1name:arr[0],
//                   p1value:"X",
//                   p1move:""
//               }
//               let p2obj={
//                   p2name:arr[1],
//                   p2value:"O",
//                   p2move:""
//               }

//               let obj={
//                   p1:p1obj,
//                   p2:p2obj,
//                   sum:1
//               }
//               playingArray.push(obj)

//               arr.splice(0,2)

//               io.emit("find",{allPlayers:playingArray})

//           }

//       }

//   })

//   socket.on("playing",(e)=>{
//       if(e.value=="X"){
//           let objToChange=playingArray.find(obj=>obj.p1.p1name===e.name)

//           objToChange.p1.p1move=e.id
//           objToChange.sum++
//       }
//       else if(e.value=="O"){
//           let objToChange=playingArray.find(obj=>obj.p2.p2name===e.name)

//           objToChange.p2.p2move=e.id
//           objToChange.sum++
//       }

//       io.emit("playing",{allPlayers:playingArray})

//   })

//   socket.on("gameOver",(e)=>{
//       playingArray=playingArray.filter(obj=>obj.p1.p1name!==e.name)
//       console.log(playingArray)
//       console.log("lol")
//   })

// })
