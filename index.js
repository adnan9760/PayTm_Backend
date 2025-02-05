const express = require("express");
const userRouter = require("./Controller/User");
const accountRouter = require("./Controller/Account");
const db = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true
  })
);

// Connect to the database
db.connect();

// Routes
app.use("/user", userRouter);
app.use("/account", accountRouter);


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`App is listening at ${PORT}`);
});
