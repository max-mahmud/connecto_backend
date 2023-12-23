import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createPost,
  getPosts,
  getPost,
  getUserPost,
  getComments,
  likePost,
  commentPost,
  replyPostComment,
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();

// crete post =done
router.post("/create-post", authMiddleware, createPost);
// get posts =done
router.post("/", authMiddleware, getPosts);
// router.post("/:id", authMiddleware, getPost);
//done
router.post("/get-user-post/:id", authMiddleware, getUserPost);

//like and comment on posts
router.post("/comment/:id", authMiddleware, commentPost);

router.get("/like/:id", authMiddleware, likePost);
router.post("/reply-comment/:id", authMiddleware, replyPostComment);

// get comments
router.post("/comments/:postId", getComments);

//delete post=done
router.delete("/:id", deletePost);

export default router;
