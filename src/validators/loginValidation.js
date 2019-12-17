/*
Validation of entered data when login
*/
const validator = require("validator");
const empty = require("is-empty");

module.exports = function validationLoginInput(user) {
  let errors = {};

  if (validator.isEmpty(user.email)) {
    errors.email = 'empty email';
  } else if (!validator.isEmail(user.email)) {
    errors.email = 'uncorrect email';
  }

  if (validator.isEmpty(user.password)) {
    errors.password = 'empty passwords';
  }

  return {
    errors,
    validation: empty(errors)
  }
};