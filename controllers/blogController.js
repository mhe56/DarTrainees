const Blog = require('../models/blogModel');
const Comment = require('../models/commentModel');
const mongoose = require('mongoose');

// get all blogs
const getBlogs = async (req, res) => {
  
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 }); // Sort by creation date descending (newest first)

    // Calculate relevancy score
    const scoredBlogs = blogs.map(blog => {
      const upvotesWeight = 1.5; // Weight for upvotes
      const timeWeight = 1; // Weight for recency

      const upvotesScore = blog.upvotes * upvotesWeight;
      const recencyScore = (Date.now() - blog.createdAt.getTime()) / (1000 * 60 * 60 * 24); // Days since creation
      const relevancyScore = upvotesScore - (recencyScore * timeWeight);

      return { ...blog._doc, relevancyScore };
    });

    // Sort blogs by relevancy score
    scoredBlogs.sort((a, b) => b.relevancyScore - a.relevancyScore);

    res.status(200).json(scoredBlogs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get blogs by the current user
const getUserBlogs = async (req, res) => {
  const user_id = req.user._id;

  const blogs = await Blog.find({ author: user_id }).sort({ createdAt: -1 });

  res.status(200).json(blogs);
};

// get a single blog
const getBlog = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such blog' });
  }

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({ error: 'No such blog' });
  }

  res.status(200).json(blog);
};

// create new blog
const createBlog = async (req, res) => {
  const { title, content } = req.body;
  console.log("hi")
  let emptyFields = [];

  if (!title) {
    emptyFields.push('title');
  }
  if (!content) {
    emptyFields.push('content');
  }
  if (emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all the fields', emptyFields });
  }

  // add doc to db
  try {
    const author = req.user._id;
    const blog = await Blog.create({ title, content, author });
    res.status(200).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteBlog = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such blog' });
  }

  try {
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'No such blog' });
    }

    // Check if the current user is the author
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not authorized to delete this blog' });
    }

    await Blog.findOneAndDelete({ _id: id });

    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const updateBlog = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such blog' });
  }

  try {
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'No such blog' });
    }

    // Check if the current user is the author
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not authorized to update this blog' });
    }

    const updatedBlog = await Blog.findOneAndUpdate({ _id: id }, { ...req.body }, { new: true });

    res.status(200).json(updatedBlog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const upvoteBlog = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such blog' });
  }

  try {
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'No such blog' });
    }

    // Check if the user has already upvoted
    if (blog.upvotedBy.includes(userId)) {
      return res.status(400).json({ error: 'You have already upvoted this blog' });
    }

    // Remove the user from downvotedBy if they had downvoted before
    blog.downvotedBy.pull(userId);
    blog.upvotedBy.push(userId);
    blog.upvotes += 1;
    blog.downvotes = Math.max(0, blog.downvotes - 1); // Ensure downvotes don't go negative

    await blog.save();

    res.status(200).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const downvoteBlog = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such blog' });
  }

  try {
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'No such blog' });
    }

    // Check if the user has already downvoted
    if (blog.downvotedBy.includes(userId)) {
      return res.status(400).json({ error: 'You have already downvoted this blog' });
    }

    // Remove the user from upvotedBy if they had upvoted before
    blog.upvotedBy.pull(userId);
    blog.downvotedBy.push(userId);
    blog.downvotes += 1;
    blog.upvotes = Math.max(0, blog.upvotes - 1); // Ensure upvotes don't go negative

    await blog.save();

    res.status(200).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const removeVote = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such blog' });
  }

  try {
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'No such blog' });
    }

    // Remove the user from upvotedBy or downvotedBy
    const upvoteIndex = blog.upvotedBy.indexOf(userId);
    if (upvoteIndex > -1) {
      blog.upvotedBy.splice(upvoteIndex, 1);
      blog.upvotes = Math.max(0, blog.upvotes - 1);
    }

    const downvoteIndex = blog.downvotedBy.indexOf(userId);
    if (downvoteIndex > -1) {
      blog.downvotedBy.splice(downvoteIndex, 1);
      blog.downvotes = Math.max(0, blog.downvotes - 1);
    }

    await blog.save();

    res.status(200).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a comment to a blog post
const addComment = async (req, res) => {
  const { id } = req.params; // Blog ID
  const { text } = req.body;

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const comment = await Comment.create({
      blog: id,
      author: req.user._id,
      text,
    });

    blog.comments.push(comment._id);
    await blog.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteComment = async (req, res) => {
  const { blogId, commentId } = req.params;

  try {
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const comment = await Comment.findOne({ _id: commentId });

    if (!comment) {
      return res.status(400).json({ error: 'Comment not found' });
    }

    // Check if the current user is the author of the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    // Remove comment from blog
    blog.comments.pull(commentId);
    await blog.save();

    // Delete the comment
    await Comment.findOneAndDelete({ _id: commentId });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getBlogs,
  getUserBlogs,
  getBlog,
  createBlog,
  deleteBlog,
  updateBlog,
  upvoteBlog,
  downvoteBlog,
  removeVote,
  addComment,
  deleteComment
};
