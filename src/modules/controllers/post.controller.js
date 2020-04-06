/*
General controller to describe all interactions with comments
*/
const users = require('../../db/models/user/index');
const posts = require('../../db/models/post/index');
const cloudinary = require('../../services/cloudinary');
const mongoose = require('mongoose');
const { getAll } = require('../../services/helpers');
const { isSameAuthor } = require('../controllers/auth.controller');
const logger = require('../../services/logger');
const ObjectId = mongoose.Types.ObjectId;

/*
  Getting data about a specific post
  route get("/post/:id")
*/
module.exports.getPost = (req, res) => {
	try {
		posts
			.findById(req.params.id)
			.then((post) => {
				if (!post) throw new Error();
				users.findById(post.authorId).then((user) => {
					const postObj = post.toObject();
					const author = user.toObject();
					postObj.author = {
						name: author.firstName + ' ' + author.lastName,
						...author
					};
					res.status(200).send(postObj);
				});
			})
			.catch((e) => res.status(404).json({ error: 'Post is not found' }));
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrGetPost', e);
	}
};

/*
  Receiving data about all user posts
  route("/user/:id/posts")
*/
module.exports.GetAllpostsUser = async (req, res) => {
	try {
		const pageOptions = {
			page: parseInt(req.query.page) || 0,
			limit: parseInt(req.query.perPage) || 5
		};
		const find = {
			authorId: req.params.id
		};
		const { model: allUserPosts, error } = await getAll(posts, pageOptions, find);
		if (error) return res.status(400).json(error);
		users
			.findById(req.params.id)
			.then((user) => {
				return allUserPosts.map((post) => {
					return {
						author: {
							name: user.firstName + user.lastName,
							...user.toObject()
						},
						...post.toObject()
					};
				});
			})
			.then((posts) => res.status(200).json(posts))
			.catch((error) => {
				console.log('error', error);
			});
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrGetAllPostsUser', e);
	}
};

/*
  Receiving data about all posts
  route get("/posts")
*/
module.exports.getAllPosts = async (req, res) => {
	try {
		const pageOptions = {
			page: parseInt(req.query.page) || 0,
			limit: parseInt(req.query.perPage) || 3
		};
		const { model: allPosts, error } = await getAll(posts, pageOptions);
		if (error) return res.status(400).json(error);
		const postsWithAuthor = allPosts.map(async (post) => {
			return await users
				.findById(post.authorId)
				.then((user) => {
					if (!user) throw new Error();
					return {
						author: {
							name: user.firstName + ' ' + user.lastName,
							...user.toObject()
						},
						...post.toObject()
					};
				})
				.catch((error) => {
					console.log('author error', error);
				});
		});
		Promise.all(postsWithAuthor)
			.then((posts) => {
				return res.status(200).json(posts);
			})
			.catch((e) => {
				res.status(500).json({ error: 'Server error' });
			});
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrGetAllPosts', e);
	}
};

/*
  Create the new post
  route post("/post")
*/
module.exports.createPost = async (req, res, next) => {
	try {
		const generateID = ObjectId().toHexString();
		const { text, images, title } = req.body;

		// Saving the images in cloudinary and getting their id, url for writing to the db
		arrPromise = images.map((image) => {
			return new Promise((resolve, reject) => {
				cloudinary.uploader.upload(
					image.src,
					{
						use_filename: true,
						public_id: `posts/${generateID}/${image.id}`
					},
					async (err, result) => {
						if (err) {
							//If a user sent the wrong image the following functions delete other uploaded images from cloudinary
							await cloudinary.api.delete_resources_by_prefix(`posts/${generateID}`);
							await cloudinary.api.delete_folder(`posts/${generateID}`).catch((err) => {
								logger.error('Error delete folder in createPost method', err);
							});
							res.status(401).json({ error: 'Uncorrect image' });
						} else {
							resolve({
								id: image.id,
								src: result.url
							});
						}
					}
				);
			});
		});
		const handleAllPromises = await Promise.all(arrPromise).then().catch((err) => {
			res.status(400).json({ error: 'Save image' });
		});

		// Creating a new post and saving in db
		const post = await posts
			.create({
				_id: generateID,
				authorId: req.user.id,
				images: handleAllPromises,
				title: title,
				text: text
			})
			.catch((e) => res.status(400).send({ error: 'Save error' }));

		// Increase the user publication counter
		if (post) {
			users
				.findByIdAndUpdate(req.user.id, { $inc: { postCounter: 1 } })
				.then((user) => {
					// new version with name
					const postObj = post.toObject();
					const author = user.toObject();
					postObj.author = {
						name: author.firstName + ' ' + author.lastName,
						...author
					};
					io.emit('allPosts', { success: true, type: 'create', post: postObj });
					next();
				})
				.catch((e) => {
					res.status(400).json({ error: 'Error increasing the number of user posts' });
				});
		}
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrCreatePost ', e);
	}
};

/*
 Post editing
 route put("/post/:id")
*/
module.exports.editPost = async (req, res) => {
	try {
		// Is the author of the user or admin
		if (!await isSameAuthor(posts, req)) {
			return res.status(403).json('Forbidden');
		}
		const { id } = req.params;
		const { images } = req.body;
		const updateData = {
			...req.body
		};
		// If there are images
		if (images) {
			// Delete old post images
			await cloudinary.api.delete_resources_by_prefix(`posts/${req.params.id}`);
			// Adding new post images and uploading them to cloudinary
			arrPromise = images.map((image) => {
				return new Promise((resolve, reject) => {
					cloudinary.uploader.upload(
						image.src,
						{
							use_filename: true,
							public_id: `posts/${id}/${image.id}`
						},
						(err, result) => {
							if (err) reject(err);
							resolve({
								id: image.id,
								src: result.url
							});
						}
					);
				});
			});
			updateData.images = await Promise.all(arrPromise).then().catch((err) => {
				res.status(400).json({ error: 'Save image' });
			});
		}
		// Updating post data in the db
		const editPost = await posts.findByIdAndUpdate(id, { $set: { ...updateData } }, { new: true });
		res.status(200).json(editPost);
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrEditPost ', e);
	}
};

/*
  Delete post
  route delete("/post/:id")
*/
module.exports.deletePost = async (req, res) => {
	const { id } = req.params;
	try {
		// Is the author of the user or admin
		if (!await isSameAuthor(posts, req)) {
			return res.status(403).json('Forbidden');
		}
		// Deleting post of cloudinary
		const post = await posts.findByIdAndDelete(id).then();
		if (post) {
			// Deleting post images from cloudinary
			await cloudinary.api.delete_resources_by_prefix(`posts/${id}`).catch((err) => {
				res.status(400).json({ error: 'Delete image error' });
			});
			// Deleting post folder in cloudinary
			await cloudinary.api
				.delete_folder(`posts/${id}`)
				.then(res.status(200).send({ success: true }))
				.catch((err) => {
					res.status(400).json({ error: 'Delete image error' });
				})
				// socket for main page
				.then(io.emit('allPosts', { success: true, type: 'delete' }));
			// Decrease user postCounter
			users.findByIdAndUpdate(post.authorId, { $inc: { postCounter: -1 } }).catch((err) => {
				res.status(400).json({ error: 'Decrease user counter of the posts' });
			});
		} else {
			res.status(400).send({ success: false });
		}
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
		logger.error('ErrDeletePost', e);
	}
};

/*
  Like post
  route put("/post/:id/like")
*/
module.exports.likePost = async (req, res) => {
	console.log("like", req.params)
	try {
		const { id } = req.params;

		posts
			.findById(id)
			.then((result) => {
				if (!result) throw new Error('Post is not found');

				const position = result.likesUsers.indexOf(req.user.id);

				if (position > -1) {
					result.likesUsers.splice(position, 1);
					result.likeCounter = result.likesUsers.length;
				} else {
					result.likesUsers.push(req.user.id);
					result.likeCounter = result.likesUsers.length;
				}
				result.save().then((post) => {
					const request = {
						id: post.id,
            likesUsers: post.likesUsers,
            dislikesUsers: post.dislikesUsers,
            likeCounter: post.likeCounter,
						dislikeCounter: post.dislikeCounter,
					};
					res.status(200).json(request);
					console.log("like request", request)
					io.emit('like', request);
				});
			})
			.catch((err) => {
				res.status(400).json({ error: 'Update like error' });
			});
	} catch (e) {
		res.status(500).json({ server: 'Server error' });
		logger.error('ErrLike', e);
	}
};

/*
  Dislike post
  route put("/post/:id/dislike")
*/
module.exports.dislikePost = async (req, res) => {
	try {
		const { id } = req.params;
		posts
			.findById(id)
			.then((result) => {
				if (!result) throw new Error('Post is not found');
				const position = result.dislikesUsers.indexOf(req.user.id);
				if (position > -1) {
					result.dislikesUsers.splice(position, 1);
					result.dislikeCounter = result.dislikesUsers.length;
				} else {
					result.dislikesUsers.push(req.user.id);
					result.dislikeCounter = result.dislikesUsers.length;
				}
				result.save().then((post) => {
          const request = {
            id: post.id,
            likesUsers: post.likesUsers,
            dislikesUsers: post.dislikesUsers,
            likeCounter: post.likeCounter,
						dislikeCounter: post.dislikeCounter,
          };
					res.status(200).json(request);
					io.emit('like', request);
				});
			})
			.catch((err) => {
				console.log('Error', err);
				res.status(400).json({ error: 'Update dislike error' });
			});
	} catch (e) {
		res.status(500).json({ server: 'Server error' });
		logger.error('ErrDislike', e);
	}
};
