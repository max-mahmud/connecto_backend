import Comments from "../models/commentModel.js";
import Posts from "../models/postModel.js";
import Users from "../models/userModel.js";
import cloudinary from "cloudinary";
import formidable from "formidable";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

export const createPost = async (req, res, next) => {
  const {
    user: { userId },
  } = req;

  const form = formidable();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(404).json({ message: "error from formidabble line 63" });
    } else {
      let { description } = fields;
      let { image } = files;

      if (!description[0]) {
        return res.status(404).json({ message: "You must provide a description" });
      }
      cloudinary.config({
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret,
        secure: true,
      });
      try {
        if (image) {
          let result = await cloudinary.uploader.upload(image[0].filepath, {
            folder: "socials",
          });

          if (result) {
            let post = await Posts.create({
              description: description[0],
              image: result.url,
              userId,
            });
          }
        } else {
          let post = await Posts.create({
            description: description[0],
            image: "",
            userId,
          });
        }
        res.status(200).json({
          success: true,
          message: "Post created successfully",
        });
      } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message });
      }
    }
  });
};

//Get Posts
export const getPosts = async (req, res, next) => {
  try {
    const {
      user: { userId },
    } = req;
    const { search } = req.body;
    // console.log(search);
    const user = await Users.findById(userId);
    const friends = user?.friends?.toString().split(",") ?? [];
    friends.push(userId);

    const searchPostQuery = {
      $or: [
        {
          description: { $regex: search, $options: "i" },
        },
      ],
    };

    const posts = await Posts.find(search ? searchPostQuery : {})
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    const friendsPosts = posts?.filter((post) => {
      return friends.includes(post?.userId?._id.toString());
    });

    const otherPosts = posts?.filter((post) => !friends.includes(post?.userId?._id.toString()));

    let postsRes = null;

    if (friendsPosts?.length > 0) {
      postsRes = search ? friendsPosts : [...friendsPosts, ...otherPosts];
    } else {
      postsRes = posts;
    }

    res.status(200).json({
      success: true,
      message: "successfully",
      data: postsRes,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

//? akhane kono kaj kora hoini
export const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Posts.findById(id).populate({
      path: "userId",
      select: "firstName lastName location profileUrl -password",
    });

    res.status(200).json({
      sucess: true,
      message: "successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getUserPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Posts.find({ userId: id })
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      sucess: true,
      message: "successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const commentPost = async (req, res, next) => {
  try {
    const { comment, from } = req.body;
    const userId = req.user.userId;
    const { id } = req.params;
    if (comment === null) {
      return res.status(404).json({ message: "Comment is required." });
    }

    const newComment = new Comments({ comment, from, userId, postId: id });

    await newComment.save();

    //updating the post with the comments id
    const post = await Posts.findById(id);

    post.comments.push(newComment._id);

    const updatedPost = await Posts.findByIdAndUpdate(id, post, {
      new: true,
    });

    res.status(201).json({ message: "comment success" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getComments = async (req, res, next) => {
  try {
    let { postId } = req.params;
    let newId = null;
    if (postId && ObjectId.isValid(postId)) {
      newId = postId;
    }
    postId = newId;
    const postComments = await Comments.find({ postId })
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .populate({
        path: "replies.userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });
    res.status(200).json({
      sucess: true,
      message: "successfully",
      data: postComments,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const likePost = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const post = await Posts.findById(id);

    const index = post.likes.findIndex((pid) => pid === String(userId));

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes = post.likes.filter((pid) => pid !== String(userId));
    }

    const newPost = await Posts.findByIdAndUpdate(id, post, {
      new: true,
    });
    res.status(200).json({
      sucess: true,
      message: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const replyPostComment = async (req, res, next) => {
  const { userId } = req.user;
  const { comment, replyAt, from } = req.body;
  const { id } = req.params;
  if (comment === null) {
    return res.status(404).json({ message: "Comment is required." });
  }

  try {
    const commentInfo = await Comments.findById(id);
    commentInfo.replies.push({
      comment,
      replyAt,
      from,
      userId,
      created_At: Date.now(),
    });
    await commentInfo.save();
    res.status(200).json(commentInfo);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Posts.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
