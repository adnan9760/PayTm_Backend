const express = require("express");
const { authMiddleware } = require("../MiddleWare/Auth");
const accountSchema = require("../model/Account"); // Ensure this is the model, not just the schema
const mongoose = require("mongoose");
const UserSchema = require("../model/UserSchema");

const router = express.Router();
router.get("/Detail", authMiddleware, async (req, res) => {
  try {
    
    const basicdetail = await UserSchema.findById(req.userId);
   

    return res.json({
      firstName: basicdetail.firstName,
      lastName: basicdetail.lastName,
    });
  } catch (error) {}
});
router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const account = await accountSchema.findOne({
      userId: req.userId,
    });

    if (!account) {
      return res.json({
        message: "Account not found",
      });
    }

    return res.json({
      balance: account.balance,
    });
  } catch (error) {
    res.json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.post("/transfer", authMiddleware, async (req, res) => {
  

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, to } = req.body;

    const account = await accountSchema
      .findOne({ userId: req.userId })
      .session(session);

    if (!account || account.balance < amount) {
      await session.abortTransaction();
      return res.json({
        message: !account ? "Account not found" : "Insufficient balance",
        status: false,
      });
    }

    const toAccount = await accountSchema
      .findOne({ userId: to })
      .session(session);

    if (!toAccount) {
      await session.abortTransaction();
      return res.json({
        message: "Invalid account",
        status: false,
      });
    }

    await accountSchema
      .updateOne({ userId: req.userId }, { $inc: { balance: -amount } })
      .session(session);
    await accountSchema
      .updateOne({ userId: to }, { $inc: { balance: amount } })
      .session(session);

    await session.commitTransaction();
    return res.json({
      message: "Transfer successful",
      status: true,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      status: false,
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;
