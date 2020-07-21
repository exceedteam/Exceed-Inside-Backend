/*
Validation of entered data when registartion new user
*/
const validator = require("validator");
const empty = require("is-empty");

module.exports = function registrationValidation(user) {
  const errors = {};
  if (user.hasOwnProperty("email")) {
    if (validator.isEmpty(user.email)) {
      errors.email = "Email cannot be empty";
    } else if ( !validator.isEmail(user.email)) {
      errors.email = "Incorrect Email";
    }
  } else {
    errors.email = "Email is required";
  }
  
  if (user.hasOwnProperty("password")) {
    if (validator.isEmpty(user.password)) {
      errors.password = "Password cannot be empty";
    } else if ( !validator.isLength(user.password, { min: 6, max: undefined })) {
      errors.password = "Password too short";
    }
  } else {
    errors.password = "Password is required";
  }
  if (user.hasOwnProperty("password2")) {
    if (validator.isEmpty(user.password2)) {
      errors.password2 = "Password cannot be empty";
    }
  } else {
    errors.password2 = "Password is required";
  }
  
  if ( !validator.equals(user.password, user.password2)) {
    errors.password = "Passwords do not match";
  }
  
  if (user.hasOwnProperty("firstName"))
    if (validator.isEmpty(user.firstName))
      errors.firstName = "First name cannot be empty";
    
  if (user.hasOwnProperty("lastName"))
    if (validator.isEmpty(user.lastName))
      errors.lastName = "Last name cannot be empty";
  
  return {
    errors,
    validation: empty(errors)
  };
};
