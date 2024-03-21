// roomUpdater.ts

// Define room update logic
export function updateRoom(io: any, roomName: string, usersArray: any[]) {
  io.to(roomName).emit("usersCount", usersArray.length);
  io.to(roomName).emit("usersInRoom", usersArray);
  console.log(
    `=================== ${roomName.toUpperCase()} ======================`
  );
  console.log(`${roomName}: update users`, usersArray);
  console.log(usersArray.length);
  console.log("==================================================");
}

// Exporting default to satisfy TypeScript's module system
export default updateRoom;
