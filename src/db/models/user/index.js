/*
  Mongoose model for creating users
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cloudinary = require('../../../services/cloudinary');
const avatarURL = cloudinary.url('avatars/default.png');

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true
		},
		firstName: {
			type: String,
			default: ''
		},
		lastName: {
			type: String,
			default: ''
		},
		admin: {
			type: Boolean,
			default: false
		},
		password: {
			type: String,
			required: true
		},
		aboutInfo: {
			type: String,
			default: ''
		},
		age: {
			type: Date,
			default: '',
			min: '1950-01-28',
			max: '2015-12-31'
		},
		position: {
			type: String,
			default: ''
		},
		team: {
			type: String,
			default: ''
		},
		postCounter: {
			type: Number,
			default: 0
		},
		commentCounter: {
			type: Number,
			default: 0
		},
		avatar: {
			type: String,
			default: avatarURL
		},
		isActive: {
			type: Boolean,
			default: true
		},
		onlineInfo: {
			type: Object,
			default: {
				isOnline: false,
				socketId: ''
			}
		}
	},
	{
		timestamps: true
	}
);

// replacement _id on id and delete fields _id, _v
userSchema.set('toJSON', {
	transform: function(doc, ret, options) {
		ret.id = ret._id;
		// ret.display = ret.lastName;
		delete ret._id;
		delete ret.__v;
	}
});

userSchema.set('toObject', {
	transform: function(doc, ret, options) {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
	}
});

module.exports = user = mongoose.model('users', userSchema);
