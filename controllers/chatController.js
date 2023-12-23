import mongoose from "mongoose";
import { messageModel } from "../models/messageModal.js";
import Users from "../models/userModel.js";
const { ObjectId } = mongoose.Types;

export const send_friend_msg = async (req, res, next) => {
  const { userId, text, receverId, name } = req.body;
  try {
    const message = await messageModel.create({
      senderId: userId,
      senderName: name,
      receverId: receverId,
      message: text,
    });

    // update friend list
    let uId = null;
    if (userId && ObjectId.isValid(userId)) {
      uId = userId;
    }
    const data = await Users.findById({ _id: uId });
    let myFriends = data.friends.map((fid) => (fid ? fid : null));
    let index = myFriends.findIndex((fid) => fid && fid.toString() === receverId);
    if (index !== -1) {
      const receiver = myFriends.splice(index, 1)[0];
      myFriends.unshift(receiver);
    }
    await Users.updateOne({ _id: uId }, { friends: myFriends });

    // Update receiver's friend list
    const receiverData = await Users.findById({ _id: receverId });
    let receiverFriends = receiverData.friends.map((fid) => (fid ? fid : null));
    let receiverIndex = receiverFriends.findIndex((fid) => fid && fid.toString() === uId);

    if (receiverIndex !== -1) {
      const sender = receiverFriends.splice(receiverIndex, 1)[0];
      receiverFriends.unshift(sender);
    }

    await Users.updateOne({ _id: receverId }, { friends: receiverFriends });
    res.status(200).json({ newMessage: message, msg: "success" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

export const get_message = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;
  try {
    let uId = null;
    if (userId && ObjectId.isValid(userId)) {
      uId = userId;
    }
    const messages = await messageModel.find({
      $or: [
        {
          $and: [
            {
              receverId: { $eq: uId },
            },
            {
              senderId: {
                $eq: id,
              },
            },
          ],
        },
        {
          $and: [
            {
              receverId: { $eq: id },
            },
            {
              senderId: {
                $eq: uId,
              },
            },
          ],
        },
      ],
    });
    res.status(200).json({ msg: messages });
  } catch (error) {
    console.log(error);
    // res.status(500).json({ error: "Internal Server Error" });
  }
};

export const watch_msg = async (req, res) => {
  try {
    const data = await messageModel.find({}).lean();
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
};
