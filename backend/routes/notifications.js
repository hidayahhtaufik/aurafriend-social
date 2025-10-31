const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const logger = require('../utils/logger');

// Create notification
async function createNotification(userAddress, type, fromAddress, message, postId = null, commentId = null) {
  try {
    const db = getDatabase();
    const timestamp = Date.now();

    await db.run(
      `INSERT INTO notifications (user_address, type, from_address, post_id, comment_id, message, is_read, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [userAddress, type, fromAddress, postId, commentId, message, timestamp]
    );

    logger.info(`Notification created for ${userAddress}: ${type}`);
  } catch (err) {
    logger.error('Error creating notification:', err);
  }
}

// Get user notifications
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;
    const db = getDatabase();

    let query = `
      SELECT n.*, u.username, u.avatar_url
      FROM notifications n
      LEFT JOIN users u ON n.from_address = u.address
      WHERE n.user_address = ?
    `;

    if (unreadOnly === 'true') {
      query += ' AND n.is_read = 0';
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';

    const notifications = await db.all(query, [address, parseInt(limit), parseInt(offset)]);

    res.json(notifications);
  } catch (err) {
    logger.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/:address/count', async (req, res) => {
  try {
    const { address } = req.params;
    const db = getDatabase();

    const result = await db.get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_address = ? AND is_read = 0',
      [address]
    );

    res.json({ count: result.count });
  } catch (err) {
    logger.error('Error fetching unread count:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);

    logger.info(`Notification ${id} marked as read`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.put('/:address/read-all', async (req, res) => {
  try {
    const { address } = req.params;
    const db = getDatabase();

    await db.run('UPDATE notifications SET is_read = 1 WHERE user_address = ?', [address]);

    logger.info(`All notifications marked as read for ${address}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error marking all as read:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.run('DELETE FROM notifications WHERE id = ?', [id]);

    logger.info(`Notification ${id} deleted`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = { router, createNotification };
