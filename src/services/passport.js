/*
  A Passport strategy for authenticating with a JSON Web Token.
*/
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const mongoose = require('mongoose');

const users = mongoose.model('users');
const opts = {};

opts.jwtFromRequest = ExtractJwt.fromHeader('authorization');
opts.secretOrKey = process.env.SECRETORKEY;

// Authenticate requests
module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, function (jwt_payload, done) {
      const { id } = jwt_payload;
      users
        .findById(id)
        .then((user) => {
          if (user) {
            done(null, user);
          } else {
            done(null, false);
          }
        })
        .catch((err) => {
          return done(err, false);
        });
    }),
  );
};
