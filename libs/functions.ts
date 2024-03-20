// Import required modules
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

// Create an Express app
const app = express();

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a Socket.io server instance using the HTTP server
const io = new Server(server, {
  cors: {
    allowedHeaders: "*",
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize countdown interval and seconds
let countdownInterval: NodeJS.Timeout;
let seconds = 30;

// Define the startCountdown function
function startCountdown() {
  // Start the countdown interval
  countdownInterval = setInterval(() => {
    // Emit countdown value to all clients
    io.emit("countdown", seconds);
    // Decrease seconds by 1
    seconds--;
    // Reset seconds to 30 if it goes below 0
    if (seconds < 0) {
      clearInterval(countdownInterval);
      seconds = 30;
    }
  }, 1000);

  // Return an object containing both variables
  return { seconds, countdownInterval };
}

// Export both startCountdown function and seconds variable
export { startCountdown, seconds, countdownInterval };
