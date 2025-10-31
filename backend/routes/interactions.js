const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const logger = require('../utils/logger');
const Joi = require('joi');
const { createNotification } = require('./notifications');

// Like post
router.post('/like', async (req, res) => {
  try {
    const { postId, userAddress, transactionHash } = req.body;
    const db = getDatabase();
    const timestamp = Date.now();

    await db.run(
      `INSERT OR REPLACE INTO likes (post_id, user_address, transaction_hash, created_at) VALUES (?, ?, ?, ?)`,
      [postId, userAddress, transactionHash, timestamp]
    );

    // Get post author to send notification
    const post = await db.get('SELECT author_address FROM posts WHERE post_id = ?', [postId]);
    
    if (post && post.author_address !== userAddress) {
      // Create notification for post author
      await createNotification(
        post.author_address,
        'like',
        userAddress,
        'liked your post',
        postId
      );
    }

    logger.info(`Post ${postId} liked by ${userAddress}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error liking post:', err);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Unlike post
router.delete('/like', async (req, res) => {
  try {
    const { postId, userAddress } = req.body;
    const db = getDatabase();

    await db.run(
      `DELETE FROM likes WHERE post_id = ? AND user_address = ?`,
      [postId, userAddress]
    );

    logger.info(`Post ${postId} unliked by ${userAddress}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error unliking post:', err);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

// Check if user liked post
router.get('/like/:postId/:userAddress', async (req, res) => {
  try {
    const { postId, userAddress } = req.params;
    const db = getDatabase();

    const like = await db.get(
      'SELECT * FROM likes WHERE post_id = ? AND user_address = ?',
      [postId, userAddress]
    );

    res.json({ hasLiked: !!like });
  } catch (err) {
    logger.error('Error checking like status:', err);
    res.status(500).json({ error: 'Failed to check like status' });
  }
});

// Create comment
router.post('/comment', async (req, res) => {
  try {
    const { commentId, postId, userAddress, commentHash, commentText, transactionHash } = req.body;
    const db = getDatabase();
    const timestamp = Date.now();

    await db.run(
      `INSERT INTO comments (comment_id, post_id, user_address, comment_hash, comment_text, transaction_hash, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [commentId, postId, userAddress, commentHash, commentText || '', transactionHash, timestamp]
    );

    // Get post author to send notification
    const post = await db.get('SELECT author_address FROM posts WHERE post_id = ?', [postId]);
    
    if (post && post.author_address !== userAddress) {
      await createNotification(
        post.author_address,
        'comment',
        userAddress,
        `commented: "${commentText.slice(0, 30)}${commentText.length > 30 ? '...' : ''}"`,
        postId,
        commentId
      );
    }

    logger.info(`Comment ${commentId} added to post ${postId} by ${userAddress}`);
    res.json({ success: true, commentId });
  } catch (err) {
    logger.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Get comments for post
router.get('/comments/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const db = getDatabase();

    const comments = await db.all(
      `SELECT c.*, u.username, u.avatar_url
       FROM comments c
       INNER JOIN users u ON c.user_address = u.address
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(comments);
  } catch (err) {
    logger.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Follow user
router.post('/follow', async (req, res) => {
  try {
    const { followerAddress, followingAddress, transactionHash } = req.body;
    const db = getDatabase();
    const timestamp = Date.now();

    await db.run(
      `INSERT OR REPLACE INTO follows (follower_address, following_address, transaction_hash, created_at) 
       VALUES (?, ?, ?, ?)`,
      [followerAddress, followingAddress, transactionHash, timestamp]
    );

    // Create notification
    await createNotification(
      followingAddress,
      'follow',
      followerAddress,
      'started following you'
    );

    logger.info(`${followerAddress} followed ${followingAddress}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error following user:', err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow user
router.delete('/follow', async (req, res) => {
  try {
    const { followerAddress, followingAddress } = req.body;
    const db = getDatabase();

    await db.run(
      `DELETE FROM follows WHERE follower_address = ? AND following_address = ?`,
      [followerAddress, followingAddress]
    );

    logger.info(`${followerAddress} unfollowed ${followingAddress}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error unfollowing user:', err);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Record tip
router.post('/tip', async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, transactionHash } = req.body;
    const db = getDatabase();
    const timestamp = Date.now();

    await db.run(
      `INSERT INTO tips (from_address, to_address, amount, transaction_hash, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [fromAddress, toAddress, amount, transactionHash, timestamp]
    );

    // Create notification
    await createNotification(
      toAddress,
      'tip',
      fromAddress,
      `sent you ${amount} ETH 💰`
    );

    logger.info(`Tip sent from ${fromAddress} to ${toAddress}: ${amount}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error recording tip:', err);
    res.status(500).json({ error: 'Failed to record tip' });
  }
});

// Get tips received by user
router.get('/tips/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const db = getDatabase();

    const tips = await db.all(
      `SELECT t.*, u.username, u.avatar_url
       FROM tips t
       INNER JOIN users u ON t.from_address = u.address
       WHERE t.to_address = ?
       ORDER BY t.created_at DESC`,
      [address]
    );

    res.json(tips);
  } catch (err) {
    logger.error('Error fetching tips:', err);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

// Record share
router.post('/share', async (req, res) => {
  try {
    const { originalPostId, newPostId, userAddress, transactionHash } = req.body;
    const db = getDatabase();
    const timestamp = Date.now();

    await db.run(
      `INSERT INTO shares (original_post_id, new_post_id, user_address, transaction_hash, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [originalPostId, newPostId, userAddress, transactionHash, timestamp]
    );

    // Get original post author
    const post = await db.get('SELECT author_address FROM posts WHERE post_id = ?', [originalPostId]);
    
    if (post && post.author_address !== userAddress) {
      await createNotification(
        post.author_address,
        'share',
        userAddress,
        'shared your post',
        originalPostId
      );
    }

    logger.info(`Post ${originalPostId} shared by ${userAddress} as ${newPostId}`);
    res.json({ success: true, newPostId });
  } catch (err) {
    logger.error('Error recording share:', err);
    res.status(500).json({ error: 'Failed to record share' });
  }
});

module.exports = router;
