import express from "express";
import { join } from "node:path";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import Axios from "axios";
// import { startCountdown, seconds, countdownInterval } from "./libs/functions";

// Use startCountdown and seconds here

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
let usersInGameRoom: any[] = [];
let countdownInterval: any;
let seconds = 30;

////////////////////// COUNTDOWN //////////////////////
function startCountdown() {
  countdownInterval = setInterval(() => {
    io.emit("countdown", seconds);
    console.log(seconds);
    seconds--;
    if (seconds === -1) {
      clearInterval(countdownInterval);
      seconds = 30;
    }
  }, 1000);
}
// startCountdown();
//////////////////////////////////////////////////////
const updateWaitingRoom = () => {
  io.to(waitingRoom).emit("usersCount", usersInWaitingRoom.length);
  io.to(waitingRoom).emit("usersInWaitingRoom", usersInWaitingRoom);
  console.log("waiting room: update users", usersInWaitingRoom);
  console.log(
    "waiting room: update usersInWaitingRoom",
    usersInWaitingRoom.length
  );
};
///////////////////////////////////////////////////////////
io.on("connection", (socket) => {
  ////////////////////// WAITING ROOM //////////////////////
  let player = {
    // name: "", // get from client
    id: socket.id,
  };

  socket.join(waitingRoom);
  console.log("Room", waitingRoom, "created");

  usersInWaitingRoom.push(player);
  updateWaitingRoom();

  // if (seconds === 0) {
  //   console.log("timeout");
  // }

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    // Remove user from waiting room
    const indexLeft = usersInWaitingRoom.findIndex(
      (user) => user.id === socket.id
    );

    console.log("indexLeft", indexLeft);
    if (indexLeft !== -1) {
      usersInWaitingRoom.splice(indexLeft, 1);
    }
    updateWaitingRoom();
  });

  // Start countdown when the first user joins the waiting room
  if (usersInWaitingRoom.length >= 1 && seconds === 30) {
    startCountdown();
    console.log("start counting");
  }

  // Terminate waiting room if it becomes empty
  if (usersInWaitingRoom.length === 0) {
    seconds = 30;
    clearInterval(countdownInterval);
    console.log("Room", waitingRoom, "terminated.");
  }

  // Move users to game room when there are four users
  if (usersInWaitingRoom.length === 5) {
    io.to(waitingRoom).emit("moveTogameRoom");

    usersInWaitingRoom.forEach((user) => {
      const socket = io.sockets.sockets.get(user.id);
      console.log(user.id);
      // Check if the socket exists
      if (socket) {
        // Leave the waiting room
        usersInGameRoom.push(player);
        socket.leave(waitingRoom);
        // Join the game room
        socket.join(gameRoom);
      }
    });
    usersInWaitingRoom = [];
  }
  ////////////////////// END OF WAITING ROOM /////////////////////
  ////////////////////// GAME ROOM //////////////////////////////
  if (usersInGameRoom.length === 5) {
    const getQuestionfromAPI = async () => {
      try {
        const res = await Axios.get("http://localhost:8080/api/v1/quiz");
        let quiz = res.data;
        // console.log("quiz", quiz);

        const shuffleQuestion = (quiz: any) => {
          // to make all the array shuffle
          for (let i = quiz.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // Random index within the unshuffled portion of the array
            // Swap elements at indices i and j
            const temp = quiz[i];
            quiz[i] = quiz[j];
            quiz[j] = temp;
          }
          // console.log("quiz", quiz);
          return quiz;
        };

        let shuffledQuestion = shuffleQuestion(quiz);

        const oneShuffleQuestion = shuffledQuestion[0];

        let questionInterval: any; // Time in milliseconds for each question
        let secondsQuiz = 10;

        function countdownQuestion() {
          questionInterval = setInterval(() => {
            // Emit countdown value to all clients
            io.to(gameRoom).emit("countdownQuestions", secondsQuiz);
            secondsQuiz--;
            if (secondsQuiz === -1) {
              clearInterval(questionInterval);
              secondsQuiz = 10;
              quiz.splice(shuffledQuestion, 1);
              if (quiz.length > 0) {
                countdownQuestion();
              }
              const options = [
                shuffledQuestion[0].answer,
                shuffledQuestion[0].option1,
                shuffledQuestion[0].option2,
                shuffledQuestion[0].option3,
              ];
              shuffleOptions(options);
              if (quiz === 0) {
                usersInGameRoom.forEach((user) => {
                  const socket = io.sockets.sockets.get(user.id);
                  console.log(user.id);
                  // Check if the socket exists
                  if (socket) {
                    // Leave the gameRoom
                    socket.leave(gameRoom);
                  }
                });
                usersInGameRoom = [];
              }
              const question = shuffledQuestion[0].question;
              io.to(gameRoom).emit("game", { question, options });
              console.log("shuffle all", { question, options });
              console.log("quiz[0]", shuffledQuestion[0]);
              console.log("shuffledQuestionss", shuffledQuestion);
              console.log(secondsQuiz);
            }
          }, 1000);
        }
        countdownQuestion();

        function shuffleOptions(array: any) {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array;
        }
        // shuffle options
        const options = [
          oneShuffleQuestion.answer,
          oneShuffleQuestion.option1,
          oneShuffleQuestion.option2,
          oneShuffleQuestion.option3,
        ];
        shuffleOptions(options);
        const question = oneShuffleQuestion.question;
        console.log("shuffle all", { question, options });
      } catch (error) {
        console.log("error");
      }
    };

    getQuestionfromAPI();
    socket.emit("socketId", socket.id);
  } else {
    console.log("gabisa ke gameroom usersInWaitingRoom kosong bos");
  }

  ////////////////////// END OF GAME ROOM //////////////////////
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
