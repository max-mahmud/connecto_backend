import express from "express";
import authRoute from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import postRoutes from "./postRoutes.js";
import chatRoutes from "./chatRoutes.js";

const router = express.Router();

router.use(`/auth`, authRoute); //auth/register
router.use(`/user`, userRoutes); //user/friend
router.use(`/post`, postRoutes); //post/comment
router.use(`/chat`, chatRoutes); //chat/comment

export default router;
