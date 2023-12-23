import express from "express";

import { send_friend_msg, get_message, watch_msg } from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send-message", authMiddleware, send_friend_msg);
router.get("/get-message/:id", authMiddleware, get_message);
router.post("/watch-message/", watch_msg);

export default router;
