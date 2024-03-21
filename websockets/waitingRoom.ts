// const waitingRoom = "waitingRoom"

import { Server } from "socket.io";
import { updateRoom } from "../libs/roomUpdater";
import { startCountdown } from "../libs/countdown";

// Define constants
const waitingRoom = "waitingRoom";
const gameRoom = "gameRoom";
let seconds = 30;
const usersInWaitingRoom: any[] = [];
const usersInGameRoom: any[] = [];
let countdownInterval: any;

// Define function to handle waiting room logic
export function handleWaitingRoom(socket: any, io: Server) {
  // Join waiting room
  socket.join(waitingRoom);

  // Add user to waiting room
  const player = {
    id: socket.id,
  };

  usersInWaitingRoom.push(player);
  updateRoom(io, waitingRoom, usersInWaitingRoom);

  // Start countdown if necessary and end it if timeout
  if (usersInWaitingRoom.length >= 1 && seconds === 30) {
    startCountdown(io, waitingRoom);
    console.log("Start counting");
  }

  // Handle disconnection
  socket.on("disconnect", () => {
    const indexLeft = usersInWaitingRoom.findIndex(
      (user) => user.id === socket.id
    );
    if (indexLeft !== -1) {
      usersInWaitingRoom.splice(indexLeft, 1);
    }
    updateRoom(io, waitingRoom, usersInWaitingRoom);

    if (usersInWaitingRoom.length === 0) {
      seconds = 30;
      clearInterval(countdownInterval);
      usersInWaitingRoom.length = 0;
      console.log("Room", waitingRoom, "terminated.");
    }

    // Move users to game room when there are five users
    if (usersInWaitingRoom.length === 5) {
      io.to(waitingRoom).emit("moveTogameRoom");

      usersInWaitingRoom.forEach((user) => {
        const socket = io.sockets.sockets.get(user.id);
        if (socket) {
          // Leave the waiting room
          usersInGameRoom.push(player);
          socket.leave(waitingRoom);
          // Join the game room
          socket.join(gameRoom);
        }
      });
      usersInWaitingRoom.length = 0;
    }
  });
}

export default handleWaitingRoom;
