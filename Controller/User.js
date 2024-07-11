const express = require("express");
const OTP = require("../model/OTP");
const zod = require("zod");
const userSchema = require("../model/UserSchema");
const accountSchema = require("../model/Account");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const authMiddleware = require("../MiddleWare/Auth");
const bcrypt = require("bcrypt");
require("dotenv").config();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const router = express.Router();

router.post("/SendOTP", async (req, res) => {
  try {
    const { userName } = req.body;
    const userexist = await userSchema.findOne({ userName });

    if (userexist) {
      return res.status(401).json({
        success: false,
        Message: "User Already Exist",
      });
    }
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("OTP Generated", otp);

    let result = await OTP.findOne({ otp: otp });
    console.log(result);
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }
    const otpPayLoad = { userName, otp };
    console.log("otpayload", otpPayLoad);
    let otpBody = await OTP.create(otpPayLoad);
    console.log("otp body", otpBody);

    return res.status(200).json({
      success: true,
      Message: "Otp sent succesfully!",
    });
  } catch (error) {
    return res.status(501).json({
      success: false,
      Message: "Some Error Occure!!",
    });
  }
});

const signUpBody = zod.object({
  userName: zod.string().refine((val) => emailRegex.test(val.toLowerCase()), {
    message: "Invalid email format",
  }),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

router.post("/signup", async (req, res) => {
  let parsedBody = await signUpBody.safeParseAsync(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      message: "Input Error",
      status: false,
      errors: parsedBody.error.errors,
    });
  }

  const { userName, firstName, lastName, password } = parsedBody.data;

  const { otp } = req.body;

  // Log the extracted fields

  try {
    // Check if user already exists
    const existingUser = await userSchema.findOne({ userName });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already taken, please use a different email",
        status: false,
      });
    }

    const recentOtp = await OTP.find({ userName: userName })
      .sort({ createdAt: -1 })
      .limit(1);
      console.log(recentOtp);
    if (recentOtp.length === 0) {
      return res.json({
        success: false,
        message: "OTP not found ",
      });
    }

    if (otp !== recentOtp[0].otp) {
      return res.json({
        success: false,

        message: "Invalid OTP ",
      });
    }
    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    // Log the hashed password

    const user = await userSchema.create({
      userName,
      password: hashPassword,
      firstName,
      lastName,
    });

    const userId = user._id;

    // Create an account for the user
    await accountSchema.create({
      userId,
      balance: 1 + Math.random() * 10000,
    });

    // Create a JWT token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);

    // Respond with success message and token
    return res.status(201).json({
      message: "User created successfully",
      status: true,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      status: false,
    });
  }
});

const loginBody = zod.object({
  userName: zod.string().email(),
  password: zod.string(),
});

router.post("/login", async (req, res) => {
  let parsedBody = await loginBody.safeParseAsync(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      message: "Incorrect inputs",
      status: false,
    });
  }

  const { userName, password } = parsedBody.data;

  const user = await userSchema.findOne({ userName });
  if (!user) {
    return res.status(400).json({
      message: "User not found",
      status: false,
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (isPasswordValid) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    return res.json({
      token,
      message: "Login successful",
      status: true,
      token,
    });
  } else {
    return res.status(400).json({
      message: "Invalid password",
      status: false,
    });
  }
});

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

// router.put("/", authMiddleware, async (req, res) => {
//   const parsedBody = updateBody.safeParse(req.body);
//   if (!parsedBody.success) {
//     return res.status(400).json({
//       message: "Error while updating information",
//     });
//   }

//   const updateData = parsedBody.data;
//   if (updateData.password) {
//     updateData.password = await bcrypt.hash(updateData.password, 10);
//   }

//   await User.updateOne({ _id: req.userId }, { $set: updateData });

//   res.json({
//     message: "Updated successfully",
//   });
// });

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await userSchema.find({
    $or: [
      { firstName: { $regex: filter, $options: "i" } },
      { lastName: { $regex: filter, $options: "i" } },
    ],
  });

  return res.json({
    users: users.map((user) => ({
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;
