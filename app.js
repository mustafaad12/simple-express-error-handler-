import express from "express";
import mongoose from "mongoose";
import colors from "colors";
import asyncHandler from "express-async-handler";

const users = [
  {
    name: "user_1",
    password: "123",
  },
  {
    name: "user_2",
    password: "456",
  },
  {
    name: "user_3",
    password: "789",
  },
];

//not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`oops! ${req.originalUrl} is not found`);
  res.status(404);
  next(error);
};

// error handling middleware
const errorHandling = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  console.log(err.kind);

  if (err.name === "CastError" && err.kind === "ObjectId") {
    message = "resources not found";
    statusCode = 404;
  }

  res.status(statusCode);
  res.json({
    message,
    stack: err.stack,
  });
};

mongoose.connect("mongodb://127.0.0.1:27017/errorHandler");

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
});

const User = mongoose.model("User", userSchema);
const app = express();

app.get("/", (req, res) => {
  res.send("helo world");
});

// import users
app.get("/import", async (req, res) => {
  await User.insertMany(users);
  res.send("successfully importeded users");
});

// destroy users
app.get("/destroy", async (req, res) => {
  await User.deleteMany();
  res.send("successfully destroyed users");
});

//get all users
app.get(
  "/api/users",
  asyncHandler(async (req, res) => {
    const users = await User.find();
    if (users.length === 0) {
      res.status(404);
      throw new Error("products is empty");
    }
    res.send(users);
  })
);

//get single user
app.get(
  "/api/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new Error("product not found");
    }
    res.send(users);
  })
);

app.use([notFound, errorHandling]);

app.listen(3000, () => {
  console.log("app is running...".blue);
});

/*
 simple error handling

 requirenments 
 1 express-async-handler to avoid using try-catch block
 2 not found middleware called if no others middleware catch the error such as wrong url
 3 error handling to deal with errors by passing throw new error
 
 usage
    1 npm install
    2 connect mongoose with your mongodb url
    3 run this command (pnpm api) to run the server
    4 test the endpoints before import sample data to the database
        localhost/api/products => products not found
        localhost/api/products:id => product not found   note : the id must be actual mongodb id
        localhost/api/products/1  => CastError  

    5 get (localhost/import) to import sample data  
*/
