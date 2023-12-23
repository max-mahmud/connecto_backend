import express from "express";
import {
  acceptRequest,
  friendRequest,
  getFriendRequest,
  getUser,
  profileViews,
  suggestedFriends,
  userDetails,
  updateUser,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
// user routes
router.get("/user-details", authMiddleware, userDetails);
router.post("/get-user/:id?", authMiddleware, getUser);
router.put("/update-user", authMiddleware, updateUser);

// friend request
router.post("/friend-request", authMiddleware, friendRequest);
router.post("/get-friend-request", authMiddleware, getFriendRequest);

// accept / deny friend request
router.post("/accept-request", authMiddleware, acceptRequest);

// view profile
router.post("/profile-view", authMiddleware, profileViews);

//suggested friends
router.post("/suggested-friends", authMiddleware, suggestedFriends);

export default router;
