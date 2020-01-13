/*
List of all app routes
*/
const express = require("express");
const router = express.Router();

// Path to controllers
const { loginUser } = require("../controllers/login.controller");
const { isSameUser, auth } = require("../controllers/auth.controller");
const {
  getUser,
  getAllUser,
  createUser,
  editUser,
  deleteUser,
} = require("../controllers/user.controller");
const {
  getAllPosts,
  getPost,
  createPost,
  editPost,
  deletePost,
  GetAllpostsUser,
  likePost,
  dislikePost
} = require("../controllers/post.controller");


// Login user
router.post("/login", loginUser);

//Getting information about all users
router.get("/users", auth, getAllUser);

// Getting information about a specific user, creating, editing, deleting
router.get("/user/:id", auth, getUser);
router.post("/user", createUser);
router.put("/user/:id", auth, isSameUser, editUser);
router.delete("/user/:id", auth, isSameUser, deleteUser); // add switch to unactive

// Getting information about all user posts
router.get("/user/:id/posts", auth, GetAllpostsUser);

// Getting information about all posts
router.get("/posts", auth, getAllPosts);

// Getting information about a specific post, creating, editing, deleting
router.get("/post/:id", auth, getPost);
router.post("/post", auth, createPost);
router.put("/post/:id", auth, isSameUser, editPost);
router.delete("/post/:id", auth, isSameUser, deletePost);

// Like/dislike post
router.put("/post/:id/like", auth, likePost);
router.put("/post/:id/dislike", auth, dislikePost);

module.exports = router;
