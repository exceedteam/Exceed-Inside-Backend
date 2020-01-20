/*
  Mongoose model for creating events
*/
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    authorId: { type: String },
    title: { type: String },
    text: { type: String },
    start: { type: Date },
    end: { type: Date },
    date: { type: Date },
    subscribedUsers: { type: Array }
  },
  {
    timestamps: true
  }
);

// replacement _id on id and delete fields _id, _v
eventSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

eventSchema.set("toObject", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = event = mongoose.model("event", eventSchema);
