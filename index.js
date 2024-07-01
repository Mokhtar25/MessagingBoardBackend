import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import message from "./modules/message.js";
import mongoose from "mongoose";
import { config } from "dotenv";
import Message from "./modules/message.js";
config();

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("connected to MongoDB", process.env.MONGODB_URL);
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message);
  });

const app = express();
app.use(express.static("dist"));
const server = createServer(app);
// const __dirname = dirname(fileURLToPath(import.meta.url));

const io = new Server(server, {
  connectionStateRecovery: {},
});

// app.get("/", (req, res) => {
//   res.sendFile(join(__dirname, "index.html"));
// });

io.on("connection", async (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  async function old() {
    const old = await Message.find();

    old.map((e) => socket.emit("chat message", e));
  }
  socket.on("typing", (msg) => {
    console.log(msg, "typoing-----------");
    if (msg === null) return socket.broadcast.emit("typing", null);
    const user = msg.username;
    socket.broadcast.emit("typing", user);
  });
  socket.on("chat message", async (msg, username) => {
    let res;
    try {
      const message = new Message({ content: msg, username });
      res = await message.save();
    } catch (err) {
      return socket.emit("chat message", 501);
    }
    io.emit("chat message", res);
  });

  // when someone is not reconved it will send new messages to everyone expect that one
  if (!socket.recovered) {
    console.log("runnin");
    try {
      const serverOffset = socket.handshake.auth.serverOffset || 0;

      if (serverOffset === 0) {
        console.log(
          socket.handshake.auth.serverOffset,
          "------------here is it ",
        );
        return old();
      }

      console.log(serverOffset, "serber offset");
      const messages = await Message.find({
        _id: { $gt: serverOffset },
      });
      console.log(messages, "messages runnning ");
      messages.map((e) => socket.emit("chat message", e));
    } catch (err) {
      return;
    }
  }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`server running at ${PORT}`);
});
