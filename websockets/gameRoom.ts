import Axios from "axios";
import { Server } from "socket.io";

const gameRoom = "gameRoom";

let countdownInterval: any;
let usersInWaitingRoom: any[] = [];

// Handling game room logic
export function handleGameRoom(socket: any, io: Server) {
  if (usersInWaitingRoom.length === 5) {
    socket.join(gameRoom);

    const getQuestionfromAPI = async () => {
      try {
        const res = await Axios.get("http://localhost:8080/api/v1/quiz");
        const quiz = res.data;

        // Shuffling logic
        const shuffleQuestion = (quiz: any) => {
          // to make all the array shuffle
          for (let i = quiz.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // Random index within the unshuffled portion of the array
            // Swap elements at indices i and j
            const temp = quiz[i];
            quiz[i] = quiz[j];
            quiz[j] = temp;
          }
          return quiz;
        };

        let shuffledQuestion = shuffleQuestion(quiz);
        let questionInterval: any; // Time in milliseconds for each question
        let secondsQuiz = 5;

        const sendQuestion = () => {
          const currentQuestion = shuffledQuestion.pop();

          function shuffleOptions(array: any) {
            for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
          }
          const options = [
            currentQuestion.answer,
            currentQuestion.option1,
            currentQuestion.option2,
            currentQuestion.option3,
          ];
          shuffleOptions(options);
          const question = currentQuestion.question;

          io.to(gameRoom).emit("game", { question, options });

          if (shuffledQuestion.length === 0) {
            clearInterval(questionInterval);
            io.to(gameRoom).emit("noMoreQuestions");
          }
        };

        const countdownQuestion = () => {
          questionInterval = setInterval(() => {
            io.to(gameRoom).emit("countdownQuestions", secondsQuiz);
            secondsQuiz--;

            if (secondsQuiz === -1) {
              secondsQuiz = 5;
              sendQuestion();
            }
          }, 1000);
        };

        countdownQuestion();
      } catch (error) {
        console.log("Error fetching questions:", error);
      }
    };

    getQuestionfromAPI();
    socket.emit("socketId", socket.id);
  } else {
    console.log("Need 5 players to start the game");
  }
}

export default handleGameRoom;
