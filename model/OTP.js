const mongoose = require("mongoose");
const MailSender = require("../utils/MailSender");
const otpSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date().toString(),
    expires: 300,
  },
});
async function sendverificationEmail(userName, otp) {
  try {
    const mailResponse = await MailSender(
        userName,
      "Verification Email from Todo",
      otp
    );
    console.log("Email Response", mailResponse);
  } catch (error) {
    console.log("error occured while sending mail");
  }
}
otpSchema.pre("save", async function (next) {
  await sendverificationEmail(this.userName, this.otp);
  next();
});
module.exports = mongoose.model("OTP", otpSchema);
