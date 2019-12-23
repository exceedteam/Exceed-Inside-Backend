/*
General controller for describing all user interactions
*/
const users = require("../../db/models/user/index");
const events = require("../../db/models/event/index");
const bcrypt = require("bcryptjs");
const registrationValidation = require("../../validators/registrationValidation");
const editValidation = require("../../validators/editDataValidation");
const cloudinary = require("../../services/cloudinary");
const { getAll } = require("../../services/helpers");
const logger = require("../../services/logger");

/*
  Getting data about a specific user
  route get("/user/:id")
*/
module.exports.getUser = async (req, res) => {
  try {
    await users
      .findById(req.params.id)
      .then(user => {
        if (!user) throw new Error();
        res.status(200).json(user);
      })
      .catch(e => res.status(404).json("User is not found"));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrGetUser", e);
  }
};

/*
  Getting data about all users
  route get("/users")
*/
module.exports.getAllUser = async (req, res) => {
  try {
    const pageOptions = {
      page: parseInt(req.query.page) || 0,
      limit: parseInt(req.query.perPage) || 10
    };
    const { model: allUsers, error } = await getAll(users, pageOptions);
    if (error) return res.status(400).json(error);
    return res.status(200).json(allUsers);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrGetAllUsers", e);
  }
};

/*
  Receiving data about all events of a specific user
  route get("/user/:id/events")
*/
module.exports.GetAllUserEvent = async (req, res) => {
  try {
    const pageOptions = {
      page: parseInt(req.query.page) || 0,
      limit: parseInt(req.query.perPage) || 10
    };
    const find = {
      authorId: req.body.id || req.params.id
    };
    // TODO move this to another function
    // const find = {
    //   subscribedUsers: { $elemMatch: { authorId: req.body.id || req.params.id } }
    // };
    const { model: allUserEvents, error } = await getAll(events, pageOptions, find);
    if (error) return res.status(400).json(error);
    return res.status(200).json(allUserEvents);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrGetAllUserEvents", e);
  }
};

/*
  New user registration
  route post("/user")
*/
module.exports.createUser = (req, res) => {
  try {
    //input data validation
    const { errors, validation } = registrationValidation(req.body);
    if (!validation) {
      return res.status(400).json(errors);
    }
    // Verification of the correspondence of the mailing address with the already registered
    user.findOne({ email: req.body.email }).then(user => {
      if (user) {
        return res.status(400).json({ email: "Email already exists" });
      } else {
        const newUser = new users({
          email: req.body.email,
          role: req.body.role,
          password: req.body.password,
          createdAt: Date.now()
        });
        // Password hashing
        bcrypt.hash(newUser.password, 10, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save().then(() => {
            res.status(200).send(newUser);
          });
        });
      }
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrAddNewUser", e);
  }
};

/*
  Change user profile data
  route put("/user/:id")
*/
module.exports.editUser = async (req, res) => {
  try {
    const { email, password, avatar } = req.body;
    const { id } = req.params;
    const updateData = {
      ...req.body
    };
    delete updateData.password;
    delete updateData.avatar;
    // User couldn't change own role
    if (!req.user.admin) delete updateData.admin;

    // Data validation
    const { errors, validation } = editValidation(req.body);
    if (!validation) {
      return res.status(400).json(errors);
    }
    // Verification of the correspondence of the mailing address with the already registered
    const user = await users.findOne({ email: email });
    if (user && user.id !== id) {
      return res.status(400).json({ email: "Email already exists" });
    }
    // Password hashing
    if (password)
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return null;
        updateData.password = hash;
      });
    // Updating edit data
    users
      .findByIdAndUpdate(id, { $set: { ...updateData } }, { new: true })
      .then(user => {
        if (!user) throw new Error("User is not found");
        // Upload avatar
        if (avatar)
          cloudinary.uploader.upload(
            avatar,
            {
              folder: "/avatars/",
              use_filename: true,
              public_id: id
            },
            (error, result) => {
              if (error) throw new Error("Avatar uploading error");
              user.avatar = result.url;
              user.save();
            }
          );
        return user;
      })
      .then(user => res.status(200).json(user))
      .catch(e => res.status(404).json(e));
  } catch (e) {
    res.status(500).send({ error: "Server error" });
    logger.error("ErrEditUser", e);
  }
};

/*
  Delete user profile
  route delete("/user/:id")
*/
module.exports.deleteUser = (req, res) => {
  try {
    users
      .findByIdAndDelete(req.params.id)
      .then(user => {
        if (!user) throw new Error();
        res.status(200).json({ success: true });
      })
      .catch(e => res.status(404).json("User is not found"));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrDeleteUser", e);
  }
};
