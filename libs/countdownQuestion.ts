// countdown.ts

import { Server } from "socket.io";

let seconds: number = 30;
let countdownInterval: NodeJS.Timeout;

export function startCountdown(io: Server, waitingRoom: string) {
  countdownInterval = setInterval(() => {
    io.to(waitingRoom).emit("countdown", seconds);
    seconds--;
    if (seconds === 0) {
      clearInterval(countdownInterval);
      console.log("Countdown finished.");
      // Handle countdown finished event
    }
  }, 1000);
}

// Exporting default to satisfy TypeScript's module system
export default startCountdown;
