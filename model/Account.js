const mongoose= require("mongoose");

const accountSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userSchema",
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
  });
  module.exports = mongoose.model("accountSchema", accountSchema);