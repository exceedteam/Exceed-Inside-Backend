/*
  General controller for describing all user interactions
*/
const bcrypt = require("bcryptjs");
const users = require("../../db/models/user/index");
const events = require("../../db/models/event/index");
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
      .then((user) => {
        if ( !user) throw new Error();
        res.status(200).json(user);
      })
      .catch((e) => res.status(404).json("User is not found"));
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
      limit: parseInt(req.query.perPage) || 1000
    };
    const { model: allUsers, error } = await getAll(users, pageOptions);
    const usersWithDisplyField = allUsers.map((user) => {
      return {
        ...user.toObject(),
        display: `${user.firstName} ${user.lastName}`
      };
    });
    if (error) return res.status(400).json(error);
    return res.status(200).json({ users: usersWithDisplyField });
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
module.exports.createUser = async (req, res) => {
  try {
    // input data validation
    const { errors, validation } = registrationValidation(req.body);
    if ( !validation) {
      return res.status(400).json(errors);
    }
    // Verification of the correspondence of the mailing address with the already registered
    users.findOne({ email: req.body.email })
      .then((user) => {
        if (user) {
          return res.status(400).json({ email: "Email already exists" });
        }
        const newUser = new users({
          aboutInfo: req.body.aboutInfo,
          age: req.body.age,
          email: req.body.email,
          role: req.body.role,
          team: req.body.team,
          position: req.body.position,
          password: req.body.password,
          createdAt: Date.now(),
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          isActive: req.body.isActive,
          admin: req.body.admin
        });
        // Password hashing
        bcrypt.hash(newUser.password, 10).then((hash) => {
          newUser.password = hash;
          newUser.save();
        }).catch(error => {
          throw new Error(error.message)
        }) ;
        return newUser;
      })
      .then(user => {
        const id = user.id;
        const { avatar } = req.body;
        if (avatar)
          return cloudinary.uploader.upload(
            avatar,
            {
              folder: "/avatars/",
              use_filename: true,
              public_id: id
            }
          ).then((result) => {
            user.avatar = result.url;
            return user.save();
          })
            .catch(error => res.status(404).json(new Error("Avatar uploading error")));
        return user;
      })
      .then((user) => {
        res.status(200).send(user);
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
    
    const { id } = req.user.admin ? req.body : req.user;
    const updateData = {
      ...req.body
    };
    // User couldn't change own role
    if ( !req.user.admin) {
      delete updateData.admin;
      delete updateData.redCrossCounter;
      delete updateData.postCounter;
      delete updateData.commentCounter;
    }
    // Data validation
    const { errors, validation } = editValidation(updateData);
    if ( !validation) {
      return res.status(400).json(errors);
    }
    delete updateData.password;
    delete updateData.avatar;
    // Verification of the correspondence of the mailing address with the already registered
    const user = await users.findOne({ email });
    if (user && user.id !== id) {
      return res.status(400).json({ email: "Email already exists" });
    }
    // Updating edit data
    users
      .findByIdAndUpdate(id, { $set: { ...updateData } }, { new: true })
      .then((user) => {
        if ( !user) throw new Error("User is not found");
        // Upload avatar
        if (avatar)
          return cloudinary.uploader.upload(
            avatar,
            {
              folder: "/avatars/",
              use_filename: true,
              public_id: id
            }
          ).then((result) => {
            user.avatar = result.url;
            return user.save();
          }).catch(error => res.status(404).json(new Error("Avatar uploading error")));
        return user;
      })
      .then((user) => res.status(200).json(user))
      .catch((e) => res.status(404).json(e));
  } catch (e) {
    res.status(500).send({ error: "Server error", e });
    console.log("Error", e);
    logger.error("ErrEditUser ", e);
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, password, password2 } = req.body;
    const { id } = req.user.admin ? req.body : req.user;
    
    const updateData = {
      oldPassword, password, password2
    };
    // User couldn't change own role
    if ( !req.user.admin) {
      return res.status(400).json("Forbidden");
    }
    
    // Data validation
    const { errors, validation } = editValidation(req.body);
    if ( !validation) {
      return res.status(400).json(errors);
    }
    
    users
      .findById(id).then((user) => {
        if ( !user) throw new Error("User is not found");
        return bcrypt
          .compare(oldPassword, user.password)
          .then((success) => {
            if (success) {
              bcrypt.hash(password, 10, (err, hash) => {
                if (err) return null;
                user.password = hash;
                user.save();
              });
            } else {
              throw new Error("");
            }
          })
          .catch((e) => {
            return res.status(400).json({ oldPassword: "Wrong Password" });
          });
      }
    )
      .then((user) => res.status(200).json("success"))
      .catch((e) => res.status(404).json(e));
  } catch (e) {
    res.status(500).send({ error: "Server error", e });
    logger.error("ErrEditUser ", e);
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
      .then((user) => {
        if ( !user) throw new Error();
        res.status(200).json({ success: true });
      })
      .catch((e) => res.status(404).json("User is not found"));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrDeleteUser", e);
  }
};

module.exports.userConnect = (id, socketId) => {
  try {
    users
      .findByIdAndUpdate(
        id,
        {
          $set: {
            onlineInfo: {
              isOnline: true,
              socketId
            }
          }
        },
        { new: true }
      )
      .then(io.emit("online"));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("set user online err", e);
  }
};

module.exports.userDisconnect = (socketId) => {
  try {
    users
      .findOneAndUpdate(
        { "onlineInfo.socketId": socketId },
        {
          $set: {
            onlineInfo: {
              isOnline: false,
              socketId: ""
            }
          }
        }
      )
      .then(io.emit("online"));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("set user disconnect err", e);
  }
};
