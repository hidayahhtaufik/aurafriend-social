const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schemas
const createUserSchema = Joi.object({
  address: Joi.string().required(),
  username: Joi.string().min(3).max(30).required(),
  profileHash: Joi.string().allow(''),
  bio: Joi.string().max(500).allow(''),
  avatarUrl: Joi.string().allow(''),
  headerUrl: Joi.string().allow(''),
});

// Create or update user profile
router.post('/profile', async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { address, username, profileHash, bio, avatarUrl, headerUrl } = value;
    const db = getDatabase();
    const timestamp = Date.now();

    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE address = ?', [address]);

    if (existingUser) {
      // Update existing user
      await db.run(
        `UPDATE users SET username = ?, profile_hash = ?, bio = ?, avatar_url = ?, header_url = ?, updated_at = ? WHERE address = ?`,
        [username, profileHash || '', bio || '', avatarUrl || '', headerUrl || '', timestamp, address]
      );
      logger.info(`User profile updated: ${address}`);
    } else {
      // Create new user
      await db.run(
        `INSERT INTO users (address, username, profile_hash, bio, avatar_url, header_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [address, username, profileHash || '', bio || '', avatarUrl || '', headerUrl || '', timestamp, timestamp]
      );
      logger.info(`New user profile created: ${address}`);
    }

    res.json({ success: true, message: 'Profile saved successfully' });
  } catch (err) {
    logger.error('Error saving profile:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Get user profile
router.get('/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const db = getDatabase();

    const user = await db.get('SELECT * FROM users WHERE address = ?', [address]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user stats
    const postCount = await db.get('SELECT COUNT(*) as count FROM posts WHERE author_address = ?', [address]);
    const followerCount = await db.get('SELECT COUNT(*) as count FROM follows WHERE following_address = ?', [address]);
    const followingCount = await db.get('SELECT COUNT(*) as count FROM follows WHERE follower_address = ?', [address]);
    const tipsReceived = await db.get('SELECT COUNT(*) as count, SUM(CAST(amount AS REAL)) as total FROM tips WHERE to_address = ?', [address]);

    res.json({
      ...user,
      stats: {
        posts: postCount.count,
        followers: followerCount.count,
        following: followingCount.count,
        tips_received: tipsReceived.count || 0,
        total_tips_eth: tipsReceived.total ? tipsReceived.total.toFixed(4) : '0.0000',
      },
    });
  } catch (err) {
    logger.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user's followers
router.get('/:address/followers', async (req, res) => {
  try {
    const { address } = req.params;
    const db = getDatabase();

    const followers = await db.all(
      `SELECT u.* FROM users u 
       INNER JOIN follows f ON u.address = f.follower_address 
       WHERE f.following_address = ? 
       ORDER BY f.created_at DESC`,
      [address]
    );

    res.json(followers);
  } catch (err) {
    logger.error('Error fetching followers:', err);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get user's following
router.get('/:address/following', async (req, res) => {
  try {
    const { address } = req.params;
    const db = getDatabase();

    const following = await db.all(
      `SELECT u.* FROM users u 
       INNER JOIN follows f ON u.address = f.following_address 
       WHERE f.follower_address = ? 
       ORDER BY f.created_at DESC`,
      [address]
    );

    res.json(following);
  } catch (err) {
    logger.error('Error fetching following:', err);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Check if user follows another user
router.get('/:follower/follows/:following', async (req, res) => {
  try {
    const { follower, following } = req.params;
    const db = getDatabase();

    const follow = await db.get(
      'SELECT * FROM follows WHERE follower_address = ? AND following_address = ?',
      [follower, following]
    );

    res.json({ isFollowing: !!follow });
  } catch (err) {
    logger.error('Error checking follow status:', err);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get trending users (most followers)
router.get('/trending', async (req, res) => {
  try {
    const db = getDatabase();

    const users = await db.all(
      `SELECT u.*, COUNT(f.id) as follower_count
       FROM users u
       LEFT JOIN follows f ON u.address = f.following_address
       GROUP BY u.address
       ORDER BY follower_count DESC, u.created_at DESC
       LIMIT 10`
    );

    res.json(users);
  } catch (err) {
    logger.error('Error fetching trending users:', err);
    res.status(500).json({ error: 'Failed to fetch trending users' });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const db = getDatabase();

    const users = await db.all(
      `SELECT * FROM users WHERE username LIKE ? OR address LIKE ? LIMIT 20`,
      [`%${query}%`, `%${query}%`]
    );

    res.json(users);
  } catch (err) {
    logger.error('Error searching users:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;
