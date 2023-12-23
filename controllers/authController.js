import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";

export const register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  //validate fileds
  if (!(firstName || lastName || email || password)) {
    return res.status(401).send({ message: "Please Provide All Fields" });
  }
  if (password.length < 6) {
    return res.status(401).send({ message: "password length 6 must " });
  }
  try {
    const userExist = await Users.findOne({ email });

    if (userExist) {
      return res.status(401).send({ message: "Email Address already exists" });
    }

    const hashedPassword = await hashString(password);

    const user = await Users.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    res.status(201).json({ message: "Account Created successFully" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    //validation
    if (!email || !password) {
      res.status(401).send({ message: "Please Provide User Credentials" });
      return;
    }

    // find user by email
    const user = await Users.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).send({ message: "User not found " });
    }

    // compare password
    const isMatch = await compareString(password, user?.password);

    if (!isMatch) {
      return res.status(401).send({ message: "Password Not match" });
    }

    user.password = undefined;

    const token = createJWT(user?._id);

    res.status(201).json({
      success: true,
      message: "Login successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
