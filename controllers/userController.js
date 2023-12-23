import Users from "../models/userModel.js";
import FriendRequest from "../models/friendRequest.js";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import formidable from "formidable";

const { ObjectId } = mongoose.Types;

export const userDetails = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await Users.findById(userId).select("-password").lean().exec();
    return res.status(200).json({ userData: user });
  } catch (error) {
    console.log(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    let targetId;

    // Check if id is provided and it's a valid ObjectId
    if (id && ObjectId.isValid(id)) {
      targetId = id;
    } else {
      targetId = userId;
    }

    if (!targetId) {
      return res.status(400).send({
        message: "Invalid User ID provided",
        success: false,
      });
    }

    const user = await Users.findById(targetId).populate({
      path: "friends",
      select: "-password",
    });

    if (!user) {
      return res.status(404).send({
        message: "User Not Found",
        success: false,
      });
    }

    user.password = undefined;

    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error occurred while fetching user",
      success: false,
      error: error.message,
    });
  }
};
export const updateUser = async (req, res, next) => {
  const form = formidable();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(404).json({ message: "error from formidabble line 63" });
    } else {
      let { firstName, lastName, location, profession, userId } = fields;
      let { image } = files;

      cloudinary.config({
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret,
        secure: true,
      });
      try {
        if (image) {
          const result = await cloudinary.uploader.upload(image[0].filepath, {
            folder: "socials",
          });
          const updateUser = {
            firstName: firstName[0],
            lastName: lastName[0],
            location: location[0],
            profileUrl: result.url,
            profession: profession[0],
            _id: userId[0],
          };

          if (result) {
            const user = await Users.findByIdAndUpdate(userId, updateUser, {
              new: true,
            });
            res.status(200).json({
              sucess: true,
              message: "User updated successfully",
              updatauser: user,
            });
          } else {
            res.status(400).json({
              sucess: false,
              message: "Image upload failed",
            });
          }
        } else {
          const updateUser = {
            firstName: firstName[0],
            lastName: lastName[0],
            location: location[0],
            profession: profession[0],
            _id: userId[0],
          };

          const user = await Users.findByIdAndUpdate(userId, updateUser, {
            new: true,
          });
          res.status(200).json({
            sucess: true,
            message: "User updated successfully",
            updatauser: user,
          });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({
          message: "auth error",
          success: false,
          error: error.message,
        });
      }
    }
  });
};

export const friendRequest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { requestTo } = req.body;
    // mySelf =>requestFrom
    // friend =>requestTo
    const requestExist = await FriendRequest.findOne({
      requestFrom: userId,
      requestTo,
    });
    if (requestExist) {
      return res.status(401).send({ message: "Already sent Request" });
    }

    const accountExist = await FriendRequest.findOne({
      requestFrom: requestTo,
      requestTo: userId,
    });
    if (accountExist) {
      return res.status(401).send({ message: "Already sent Requestt" });
    }

    const newRes = await FriendRequest.create({
      requestTo,
      requestFrom: userId,
    });

    res.status(201).json({
      success: true,
      message: "Friend Request sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};
// get friend request=========
export const getFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;

    const request = await FriendRequest.find({
      requestTo: userId,
      requestStatus: "Pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession -password",
      })
      .limit(10)
      .sort({
        _id: -1,
      });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const id = req.user.userId;
    const { rid, status } = req.body;

    const requestExist = await FriendRequest.findById(rid);
    // console.log(requestExist);
    if (!requestExist) {
      return res.status(404).json({ message: "No Friend Request Found." });
    }

    // Update the friend request status
    const updatedRequest = await FriendRequest.findByIdAndUpdate(
      { _id: rid },
      { requestStatus: status },
      { new: true }
    );

    if (status === "Accepted") {
      const user = await Users.findById(id);
      user.friends.push(updatedRequest?.requestFrom);
      await user.save();

      const friend = await Users.findById(updatedRequest?.requestFrom);
      friend.friends.push(updatedRequest?.requestTo);
      await friend.save();
    }

    // Delete the request if it's accepted or denied
    if (status === "Accepted" || status === "Denied") {
      await FriendRequest.findByIdAndDelete(rid);
    }
    //find request again
    const request = await FriendRequest.find({
      requestTo: id,
      requestStatus: "Pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession -password",
      })
      .limit(10)
      .sort({
        _id: -1,
      });

    res.status(201).json({
      success: true,
      message: `Friend Request ${status}`,
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error handling friend request",
      success: false,
      error: error.message,
    });
  }
};

export const profileViews = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.body;
    if (userId !== id) {
      const user = await Users.findById(id);
      user.views.push(userId);
      await user.save();

      res.status(201).json({
        success: true,
        message: "Successfully",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const suggestedFriends = async (req, res) => {
  try {
    const userId = req.user.userId;
    // requestFrom: requestTo,
    const accountExist = await FriendRequest.find({
      requestFrom: userId,
    }).select("requestTo");

    let alreadyFriend = await Users.findById(userId);
    let queryObject = {};
    queryObject._id = { $ne: userId }; //not equal ($ne)
    queryObject.friends = { $nin: alreadyFriend.friends }; //does not contain ($nin: not in)

    let queryResult = await Users.find(queryObject)
      .limit(15)
      .select("firstName lastName profileUrl profession -password");

    // console.log(queryResult);
    res.status(200).json({
      success: true,
      data: queryResult,
      pending: accountExist,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
