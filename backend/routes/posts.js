const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schemas
const createPostSchema = Joi.object({
  postId: Joi.number().required(),
  authorAddress: Joi.string().required(),
  contentHash: Joi.string().required(),
  contentText: Joi.string().allow(''),
  mediaUrls: Joi.string().allow(''),
  transactionHash: Joi.string().required(),
});

// Create post
router.post('/', async (req, res) => {
  try {
    const { error, value } = createPostSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { postId, authorAddress, contentHash, contentText, mediaUrls, transactionHash } = value;
    const db = getDatabase();
    const timestamp = Date.now();

    await db.run(
      `INSERT INTO posts (post_id, author_address, content_hash, content_text, media_urls, transaction_hash, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [postId, authorAddress, contentHash, contentText || '', mediaUrls || '', transactionHash, timestamp]
    );

    logger.info(`Post created: ${postId} by ${authorAddress}`);
    res.json({ success: true, postId });
  } catch (err) {
    logger.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get timeline (all posts)
router.get('/timeline', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const db = getDatabase();

    const posts = await db.all(
      `SELECT p.*, u.username, u.avatar_url,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comment_count
       FROM posts p
       INNER JOIN users u ON p.author_address = u.address
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    res.json(posts);
  } catch (err) {
    logger.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// Get single post
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const db = getDatabase();

    const post = await db.get(
      `SELECT p.*, u.username, u.avatar_url,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comment_count
       FROM posts p
       INNER JOIN users u ON p.author_address = u.address
       WHERE p.post_id = ?`,
      [postId]
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    logger.error('Error fetching post:', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Get user's posts
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const db = getDatabase();

    const posts = await db.all(
      `SELECT p.*, u.username, u.avatar_url,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comment_count
       FROM posts p
       INNER JOIN users u ON p.author_address = u.address
       WHERE p.author_address = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [address, parseInt(limit), parseInt(offset)]
    );

    res.json(posts);
  } catch (err) {
    logger.error('Error fetching user posts:', err);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get posts from followed users
router.get('/feed/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const db = getDatabase();

    const posts = await db.all(
      `SELECT p.*, u.username, u.avatar_url,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comment_count
       FROM posts p
       INNER JOIN users u ON p.author_address = u.address
       INNER JOIN follows f ON p.author_address = f.following_address
       WHERE f.follower_address = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [address, parseInt(limit), parseInt(offset)]
    );

    res.json(posts);
  } catch (err) {
    logger.error('Error fetching feed:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

module.exports = router;
