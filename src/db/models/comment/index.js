/*
  Mongoose model for creating comments
*/
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    authorId: { type: String },
    mentionedUser: [],
    answeredUser: [],
    postId: {
      type: String
    },
    text: { 
      type: String 
    },
    withoutParent: { 
      type: Boolean, 
      default: true 
    },
    parent: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// replacement _id on id and delete fields _id, _v
commentSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

commentSchema.set("toObject", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = comment = mongoose.model("comment", commentSchema);
