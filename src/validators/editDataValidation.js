/*
  Validation of entered data when changing a profile
*/
const validator = require('validator');
const empty = require('is-empty');
const { fillEmptyFields } = require('../services/helpers');

module.exports = function editDataValidation(user) {
  const errors = {};

  user = fillEmptyFields(user, ['email', 'password']);

  if (user.hasOwnProperty('email'))
    if (validator.isEmpty(user.email)) {
      errors.email = 'empty email';
    } else if (!validator.isEmail(user.email)) {
      errors.email = 'uncorrect email';
    }

  if (user.hasOwnProperty('oldPassword') && user.hasOwnProperty('password') && user.hasOwnProperty('password2') ) {
    if (validator.isEmpty(user.oldPassword)) errors.oldPassword = 'Old password cannot be empty';
    if (validator.isEmpty(user.password2)) errors.password2 = 'Password cannot be empty';
    if (!validator.equals(user.password, user.password2)) errors.password = 'Password mismatch';
    if (validator.isEmpty(user.password)) {
      errors.password = 'Password cannot be empty';
    } else if (!validator.isLength(user.password, { min: 6, max: undefined })) {
      errors.password = 'Password too short';
    }
  }

  if (user.hasOwnProperty('redCrossCounter'))
    if ( typeof user.redCrossCounter !== 'number' ) {
      errors.redCrossCounter = 'the field can be number';
    } else if (user.redCrossCounter < 0) {
      errors.redCrossCounter = 'value cannot be a negative number';
    }

  if (user.hasOwnProperty('commentCounter'))
    if (typeof user.commentCounter !== 'number') {
      errors.commentCounter = 'the field cannot be empty';
    } else if (user.commentCounter < 0) {
      errors.commentCounter = 'value cannot be a negative number';
    }

  if (user.hasOwnProperty('age'))
    if (user.age !== null)
    if (validator.isBefore(user.age, '01.01.1900')) {
      errors.age = 'value cannot be';
    }

  return {
    errors,
    validation: empty(errors),
  };
};
