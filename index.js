import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { config } from "dotenv";
import Message from "./modules/message.js";
config();

const URL =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URL
    : process.env.TEST_MONGODB_URL;

mongoose
  .connect(URL)
  .then(() => {
    console.log("connected to MongoDB", URL);
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
  cors: {
    origin: "http://localhost:5173",
  },
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
    console.log(msg, "typing-----------");
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
    console.log("Recovering");
    try {
      const serverOffset = socket.handshake.auth.serverOffset || 0;

      if (serverOffset === 0) {
        return old();
      }

      const messages = await Message.find({
        _id: { $gt: serverOffset },
      });
      messages.map((e) => socket.emit("chat message", e));
    } catch (err) {
      return;
    }
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`server running at ${PORT}`);
});
