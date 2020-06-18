/*
Controller for login on the site
*/

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const user = require('../../db/models/user');
const validationLogin = require('../../validators/loginValidation');
const logger = require('../../services/logger');

// Login module
module.exports.loginUser = (req, res) => {
  try {
    // Input data validation
    const { errors, validation } = validationLogin(req.body);
    if (!validation) {
      return res.status(400).json(errors);
    }
    const { email } = req.body;
    const { password } = req.body;
    // Comparsion of e-mail with already registered e-mail
    user
      .findOne({ email })
      .then((user) => {
        if (!user) {
          return res.status(404).json({ email: 'No such email' });
        }
        // if (!user.isActive) {
        //   return res.status(401).json({ error: 'User is not active' });
        // }
        // Password comparison
        bcrypt
          .compare(password, user.password)
          .then((success) => {
            if (success) {
              // Create JWT token for user
              jwt.sign(
                (data = {
                  id: user.id,
                  admin: user.admin,
                }),
                process.env.SECRETORKEY,
                { expiresIn: '7d' },
                (err, token) => {
                  res.json({
                    token,
                  });
                },
              );
            } else {
              return res.status(400).json({ password: 'Wrong password' });
            }
          })
          .catch((e) => {
            res.status(400).json({ error: 'Password comparison error' });
          });
      })
      .catch((e) => {
        res.status(400).json({ error: 'Email error' });
      });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
    logger.error('ErrGetUser', e);
  }
};
