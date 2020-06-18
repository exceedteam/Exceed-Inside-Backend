/*
List of all app routes
*/
const express = require('express');

const router = express.Router();

// Path to controllers
const { loginUser } = require('../controllers/login.controller');
const { isSameUser, auth } = require('../controllers/auth.controller');
const {
  getUser,
  getAllUser,
  createUser,
  editUser,
  deleteUser,
  GetAllUserEvent,
} = require('../controllers/user.controller');
const {
  getAllPosts,
  getPost,
  createPost,
  editPost,
  deletePost,
  GetAllPostsUser,
  likePost,
  dislikePost,
} = require('../controllers/post.controller');
const {
  getAllComments,
  createComment,
  editComment,
  deleteComment,
} = require('../controllers/comment.controller');
const {
  getAllEvents,
  getEvent,
  createEvent,
  editEvent,
  deleteEvent,
  subscribeEvent,
  subscribeAllEvents,
  unsubscribeAllEvents,
  unsubscribeEvent,
} = require('../controllers/event.controller');

// Login user
router.post('/login', loginUser);

// Getting information about all users
router.get('/users', auth, getAllUser);

// Getting information about a specific user, creating, editing, deleting
router.get('/user/:id', auth, getUser);
router.post('/user', createUser);
router.put('/user/:id', auth, isSameUser, editUser);
router.delete('/user/:id', auth, isSameUser, deleteUser); // add switch to unactive

// Receiving user events
router.get('/user/:id/events', auth, GetAllUserEvent);

// Getting information about all user posts
router.get('/user/:id/posts', auth, GetAllPostsUser);

// Getting information about all posts
router.get('/posts', auth, getAllPosts);

// Getting information about a specific post, creating, editing, deleting
router.get('/post/:id', auth, getPost);
router.post('/post', auth, createPost);
router.put('/post/:id', auth, isSameUser, editPost);
router.delete('/post/:id', auth, isSameUser, deletePost);

// Like/dislike post
router.put('/post/:id/like', auth, likePost);
router.put('/post/:id/dislike', auth, dislikePost);

// Getting post comments
router.get('/post/:postId/comments', auth, getAllComments);

// Create, edit, delete comment
router.post('/post/:postId/comment', auth, createComment, getAllComments);
router.put('/post/:postId/comment/:commentId', auth, editComment);
router.delete('/post/:postId/comment/:commentId', auth, deleteComment, getAllComments);

// Receiving all events
router.get('/events', auth, getAllEvents);

// Subscribe to the event
router.put('/event/:id/subscribe', auth, subscribeEvent);
router.put('/events/subscribe', auth, subscribeAllEvents);

// Unsubscribe from the event
router.put('/event/:id/unsubscribe', auth, unsubscribeEvent);
router.put('/events/unsubscribe', auth, unsubscribeAllEvents);

// Getting information about a specific event, creating, editing, deleting
router.get('/event/:id', auth, getEvent);
router.post('/event', auth, createEvent);
router.put('/event/:id', auth, editEvent);
router.delete('/event/:id', auth, deleteEvent, getAllEvents);

module.exports = router;
