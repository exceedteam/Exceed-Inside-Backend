/*
General controller to describe all interactions with comments
*/
const users = require("../../db/models/user/index");
const posts = require("../../db/models/post/index");
const comments = require("../../db/models/comment/index");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const logger = require("../../services/logger");
const { getAll } = require("../../services/helpers");
const { isSameAuthor } = require("../controllers/auth.controller");

/* 
Get all comments of post. 
route: get("/post/:postId/comments") 
*/
module.exports.getAllComments = async (req, res) => {
  try {
    const pageOptions = {
      page: parseInt(req.query.page) || 0,
      limit: parseInt(req.query.perPage) || 10
    };
    const find = {
      postId: req.params.postId
    };
    const { model: allCommentsOfPost, error } = await getAll(comments, pageOptions, find);
    if (error) return res.status(400).json(error);
    return res.status(200).json(allCommentsOfPost);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrGetAllCommentsOfPost ", e);
  }
};

/* 
  Create comment of post. 
  route: post("/post/:postId/comment")
*/
module.exports.createComment = async (req, res, next) => {
  try {
    const generateId = ObjectId().toHexString();
    const { postId } = req.params;
    const { text, mentionedUser } = req.body;

    // Is there such a post in the db
    const valid = await posts
      .findById(postId)
      .then(result => {
        if (result) return true;
        return false;
      })
      .catch(e => {
        return false;
      });

    if (!valid) {
      return res.status(404).json("Post is not found");
    }

    // Create comment
    const comment = await comments
      .create({
        _id: generateId,
        authorId: req.user.id,
        postId: postId,
        text: text,
        mentionedUser: mentionedUser
      })
      .catch(e => {
        res.status(400).send({ error: "Save error" });
        return false;
      });
    // Increase the user’s publication counter and the post’s comment counter
    if (comment) {
      await users.findByIdAndUpdate(req.user.id, { $inc: { commentCounter: 1 } }).catch(e => {
        // res.status(400).json({ error: "Error increasing the number of user comment" });
        logger.error("Error increasing the number of user comment");
      });
      await posts.findByIdAndUpdate(postId, { $inc: { commentsCounter: 1 } }).catch(e => {
        // res.status(400).json({ error: "Error increasing the number of comments of post" })
        logger.error("Error increasing the number of comments of post");
      });
    }
    next();
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrCreateComment ", e);
  }
};

/*
  Post comment change. 
  route put("/post/:postId/comment/:commentId")
*/
module.exports.editComment = async (req, res, next) => {
  try {
    // Is the author of the user or admin
    if (!(await isSameAuthor(comments, req))) {
      return res.status(403).json("Forbidden");
    }
    const { commentId } = req.params;
    const updateData = {
      ...req.body
    };
    // User couldn't change autor
    if (!req.user.admin) delete updateData.authorId;

    await comments.findByIdAndUpdate(commentId, { $set: { ...updateData } }).catch(e => res.status(400).json({ error: "edit error" }));
    next();
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrUpdateComment ", e);
  }
};

/* 
  Delete comment 
  route delete("/post/:postId/comment/:commentId")
*/
module.exports.deleteComment = async (req, res, next) => {
  try {
    // Is the author of the user or admin
    if (!(await isSameAuthor(comments, req))) {
      return res.status(403).json("Forbidden");
    }
    const { postId, commentId } = req.params;
    // Delete a comment from the db
    const commentDelete = await comments.findByIdAndDelete(commentId).then().catch(e => {
      res.status(400).send({ success: false});
    });
    // Decrease in the user and post comments counter
    if (commentDelete) {
      await users.findByIdAndUpdate(commentDelete.authorId, { $inc: { commentCounter: -1 } });
      await posts.findByIdAndUpdate(postId, { $inc: { commentsCounter: -1 } });
    } else {
      res.status(400).send({ success: false });
    }
    next();
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrDeleteComment ", e);
  }
};
