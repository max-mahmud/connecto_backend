import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server as socketIO } from "socket.io";
import dbConnection from "./dbConfig/index.js";
import router from "./routes/index.js";
dotenv.config();
const app = express();

const server = createServer(app);
app.use(cors());
const io = new socketIO(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

var allActive = [];
const addUser = (id, socketId, userInfo) => {
  const checkUser = allActive.some((u) => u.id === id);
  if (!checkUser) {
    allActive.push({
      id,
      socketId,
      userInfo,
    });
  }
};
const findFriend = (userId) => {
  return allActive.find((c) => c.id === userId);
};

const remove = (socketId) => {
  allActive = allActive.filter((c) => c.socketId !== socketId);
};

io.on("connection", (soc) => {
  console.log("socket connection on...");

  soc.on("add_user", (id, userInfo) => {
    addUser(id, soc.id, userInfo);
    io.emit("activeFriend", allActive);
  });

  soc.on("message", (text) => {
    console.log(text);
  });

  soc.on("send_friend_message", (msg) => {
    const seller = findFriend(msg.receverId);
    if (seller !== undefined) {
      soc.to(seller.socketId).emit("friend_message", msg);
    }
  });

  soc.on("disconnect", () => {
    console.log("user disconnect..");
    remove(soc.id);
    io.emit("activeFriend", allActive);
  });
});

const PORT = process.env.PORT || 8800;
dbConnection();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(router);

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
