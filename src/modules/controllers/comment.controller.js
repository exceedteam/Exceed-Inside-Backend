/*
General controller to describe all interactions with comments
*/
const users = require('../../db/models/user/index');
const posts = require('../../db/models/post/index');
const comments = require('../../db/models/comment/index');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const logger = require('../../services/logger');
const { getAll } = require('../../services/helpers');
const { isSameAuthor } = require('../controllers/auth.controller');

/* 
Get all comments of post. 
route: get("/post/:postId/comments") 
*/
module.exports.getAllComments = async (req, res) => {
	try {
		const handleComments = ({ type, comment }) => {
			let find = {};
			switch (type) {
				case '0': {
					find = {
						postId: comment.params.postId,
						withoutParent: true
					};
					return find;
				}
				default:
					find = {
						postId: comment.params.postId,
						parent: comment.query.commentId
					};
					return find;
			}
		};

		const find = handleComments({ type: req.query.commentId, comment: req });

		const pageOptions = {
			page: parseInt(req.query.page) || 0,
			limit: parseInt(req.query.perPage) || 10
		};

		const { model: allCommentsOfPost, error } = await getAll(comments, pageOptions, find);
		if (error) return res.status(400).json(error);
		const commentsWithAuthor = allCommentsOfPost.map(async (comment) => {
			return await users
				// sending user data with comments
				.findById(comment.authorId)
				.then((user) => {
					if (!user) throw new Error();
					return {
						author: {
							name: user.firstName + ' ' + user.lastName,
							...user.toObject()
						},
						...comment.toObject()
					};
				})
				.catch((error) => {
					console.log('author error', error);
				});
		});
		Promise.all(commentsWithAuthor)
			.then((comments) => {
				return res.status(200).json(comments);
			})
			.catch((error) => {
				res.status(500).json({ error: 'Server error' });
			});
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrGetAllCommentsOfPost ', e);
	}
};

/* 
  Create comment of post. 
  route: post("/post/:postId/comment")
*/
module.exports.createComment = async (req, res ) => {
	try {
		const generateId = ObjectId().toHexString();
		const { postId } = req.params;
		const { text, mentionedUser, withoutParent, parent } = req.body;

		// Is there such a post in the db
		const valid = await posts
			.findById(postId)
			.then((result) => {
				if (result) return true;
				return false;
			})
			.catch(() => {
				return false;
			});

		await comments.findByIdAndUpdate(parent, { $push: { answeredUser: generateId } }).then().catch(() => {
			return false;
		});

		if (!valid) {
			return res.status(404).json('Post is not found');
		}

		// Create comment
		const comment = await comments
			.create({
				_id: generateId,
				authorId: req.user.id,
				postId: postId,
				text: text,
				mentionedUser: mentionedUser,
				withoutParent: withoutParent,
				parent: parent
			})
			.catch((e) => {
				res.status(400).send({ error: 'Save error' });
				return false;
			});
		// Increase the user’s publication counter and the post’s comment counter
		if (comment) {
			await users.findByIdAndUpdate(req.user.id, { $inc: { commentCounter: 1 } }).catch((e) => {
				logger.error('Error increasing the number of user comment');
			});
			await posts.findByIdAndUpdate(postId, { $inc: { commentsCounter: 1 } }, {new: true}).catch((e) => {
				logger.error('Error increasing the number of comments of post');
			}).then((commentCounter) => {
				io.emit("commentCounter", commentCounter)
			});
			// sending user data with a comment
			await users.findById(comment.authorId)
			.then((user) => {
				const commentObj = comment.toObject();
				const author = user.toObject();
				commentObj.author = {
					name: author.firstName + ' ' + author.lastName,
					...author
				};


				// socket
				// broadcast по идее должен передавать сообщение всем, кроме отправителя. но пишет, что undefined
				// io.broadcast.emit('newComment', commentObj);


				return res.status(200).json(commentObj)
			}).catch(err => {res.status(400).json("Author is not found"); console.log("err", err)});
		}
		// next();
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrCreateComment ', e);
	}
};

/*
  Post comment change. 
  route put("/post/:postId/comment/:commentId")
*/
module.exports.editComment = async (req, res, next) => {
	try {
		// Is the author of the user or admin
		if (!await isSameAuthor(comments, req)) {
			return res.status(403).json('Forbidden');
		}
		const { commentId } = req.params;
		const updateData = {
			...req.body
		};
		// User couldn't change autor
		if (!req.user.admin) delete updateData.authorId;

		await comments
			.findByIdAndUpdate(commentId, { $set: { ...updateData } })
			.catch((e) => res.status(400).json({ error: 'edit error' }));
		next();
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrUpdateComment ', e);
	}
};

/* 
  Delete comment 
  route delete("/post/:postId/comment/:commentId")
*/
module.exports.deleteComment = async (req, res, next) => {
	try {
		// Is the author of the user or admin
		if (!await isSameAuthor(comments, req)) {
			return res.status(403).json('Forbidden');
		}
		const { postId, commentId } = req.params;
		// Delete a comment from the db
		const commentDelete = await comments.findByIdAndDelete(commentId).then().catch((e) => {
			res.status(400).send({ success: false });
		});
		// Decrease in the user and post comments counter
		if (commentDelete) {
			await users.findByIdAndUpdate(commentDelete.authorId, {
				$inc: { commentCounter: -1 }
			});
			await posts.findByIdAndUpdate(postId, { $inc: { commentsCounter: -1 } }, {new: true})
			.then((commentCounter) => io.emit("commentCounter", commentCounter));
		} else {
			res.status(400).send({ success: false });
		}
		next();
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrDeleteComment ', e);
	}
};
