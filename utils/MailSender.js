const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (userName, title, body) => {
  if (!userName || !title || !body) {
    return res
      .status(400)
      .json({ message: "Email, title, and body are required" });
  }

  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587, 
      secure: false, 
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: '"Safe Payment - by PayTm" <' + process.env.MAIL_USER + ">", // sender address
      to: userName, // recipient's email
      subject: title, // Subject line
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #dddddd;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #4CAF50;
            padding: 10px 0;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .content p {
            font-size: 16px;
            color: #333333;
        }
        .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 10px 0;
            color: #777777;
            font-size: 12px;
            border-top: 1px solid #dddddd;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Safe Payment - by PayTm</h1>
        </div>
        <div class="content">
            <p>Dear User,</p>
            <p>Your OTP (One-Time Password) for verification is:</p>
            <div class="otp-code">${body}</div>
            <p>Please use this OTP to complete your verification process. This OTP is valid for the next 10 minutes.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Studynotion. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`
    });

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ message: "Email sent successfully", info: info });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ message: "Failed to send email", error: error.message });
  }
};

module.exports = mailSender;
