/*
  Module with help functions
*/

const empty = require('is-empty');

// If an object has fields with the undefined or null value this function fills the field empty string
// Used for validator
exports.fillEmptyFields = (object, fields) => {
  fields.forEach((element) => {
    if (object.hasOwnProperty(element))
      object[element] = !empty(object[element]) ? object[element] : '';
  });
  return object;
};

// General function to get all elements from the DB
// Return an object with model and error fields, where the model is an array of DB items
exports.getAll = async function getAll(model, pagination, find = {}) {
  if (!pagination) {
    pagination = {
      page: 0,
      limit: 1000,
    };
  }
  // TODO add custom getting of events
  return await model
    .find(find)
    .sort({ createdAt: -1 })
    .skip(pagination.page * pagination.limit)
    .limit(pagination.limit)
    .then((items) => {
      if (!items) throw new Error();
      return { model: items, error: null };
    })
    .catch((e) => {
      return { model: [], error: { error: 'User is not found' } };
    });
};
