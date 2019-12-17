/*
  Mongoose model for creating posts
*/
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    authorId: { type: String },
    commentsCounter: {
      type: Number,
      default: 0
    },
    images: [],
    text: { type: String },
    title: { type: String }
  },
  {
    timestamps: true
  }
);
// replacement _id on id and delete fields _id, _v
postSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = post = mongoose.model("post", postSchema);
