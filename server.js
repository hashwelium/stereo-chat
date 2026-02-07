const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let clients = [];

wss.on('connection', ws => {
  clients.push(ws);
  ws.on('message', msg => {
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    });
  });
});

console.log("Signaling server running on port 3000");
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("offer", (data) => socket.broadcast.emit("offer", data));
  socket.on("answer", (data) => socket.broadcast.emit("answer", data));
  socket.on("ice-candidate", (data) => socket.broadcast.emit("ice-candidate", data));

  socket.on("disconnect", () => console.log("User disconnected"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});


