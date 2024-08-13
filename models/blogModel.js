const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  downvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  }],
}, {
  timestamps: true,
});

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
