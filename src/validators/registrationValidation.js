/*
Validation of entered data when registartion new user
*/
const validator = require('validator');
const empty = require('is-empty');

module.exports = function registrationValidation(user) {
  const errors = {};

  if (validator.isEmpty(user.email)) {
    errors.email = 'empty email';
  } else if (!validator.isEmail(user.email)) {
    errors.email = 'uncorrect email';
  }

  if (validator.isEmpty(user.password)) {
    errors.password = 'empty password';
  } else if (!validator.isLength(user.password, { min: 6, max: undefined })) {
    errors.password = 'password too short';
  }

  if (validator.isEmpty(user.password2)) {
    errors.password2 = 'empty password';
  }

  if (!validator.equals(user.password, user.password2)) {
    errors.password = 'passwords do not match';
  }

  if (validator.isEmpty(user.firstName) || validator.isEmpty(user.lastName)) {
    errors.name = 'First name and Last name must be filled';
  }

  return {
    errors,
    validation: empty(errors),
  };
};
