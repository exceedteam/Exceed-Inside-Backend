/*
General controller for user identification
*/
const passport = require('passport');

// Check does the user have a token
module.exports.auth = (req, res, next) => {
  const auth = passport.authenticate('jwt', function (err, user, info) {
    if (err || !user) {
      return res.status(400).json({ Error: 'Token error' });
    }
    // const { isActive } = user;
    // if (!isActive) {
    //   return res.status(401).json({ Error: 'User is not active' });
    // }
    req.user = {
      admin: user.admin,
      id: user.id || '',
    };
    next();
  });
  auth(req, res, next);
};

// Check: wathever the user is admin or owner for routes: put(/user/:id), delete(/user/:id)
module.exports.isSameUser = (req, res, next) => {
  if (req.params.id === req.user.id || req.user.admin) {
    return next();
  }
  res.status(403).json('Forbidden');
};

/*
Check: wathever the user is admin or owner for controllers:
editComment, deleteComment, editEvent, deleteEvent, editPost, deletePost
*/

exports.isSameAuthor = async function isSameAuthor(model, req) {
  const item = await model.findById(req.params.id || req.params.commentId, { authorId: '' }).then();
  const { authorId } = item;
  if (authorId === req.user.id || req.user.admin) {
    return true;
  }
  return false;
};
