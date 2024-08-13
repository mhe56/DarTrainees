const express = require('express');
const {
  getBlogs,
  getBlog,
  createBlog,
  deleteBlog,
  updateBlog,
  upvoteBlog,
  downvoteBlog,
  removeVote,
  addComment,
  deleteComment
} = require('../controllers/blogController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Require auth for all blog routes
router.use(requireAuth);

// GET all blogs
router.get('/', getBlogs);

// GET a single blog
router.get('/:id', getBlog);

// POST a new blog
router.post('/', createBlog);

// DELETE a blog
router.delete('/:id', deleteBlog);

// UPDATE a blog
router.patch('/:id', updateBlog);

// Upvote a blog
router.post('/:id/upvote', upvoteBlog);

// Downvote a blog
router.post('/:id/downvote', downvoteBlog);

// Remove vote from a blog
router.post('/:id/remove-vote', removeVote);

// Add a comment to a blog
router.post('/:id/comments', addComment);

// Delete a comment from a blog
router.delete('/:blogId/comments/:commentId', deleteComment);

module.exports = router;
