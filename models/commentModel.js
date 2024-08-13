const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  blog: {
    type: Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  postedOn: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, 
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
