const express = require('express');
const router = express.Router();
const { getContract, getProvider } = require('../utils/contract');
const logger = require('../utils/logger');

// Get contract address
router.get('/address', (req, res) => {
  res.json({ address: process.env.CONTRACT_ADDRESS });
});

// Get contract ABI
router.get('/abi', (req, res) => {
  const { CONTRACT_ABI } = require('../utils/contract');
  res.json({ abi: CONTRACT_ABI });
});

// Get post counter
router.get('/post-counter', async (req, res) => {
  try {
    const contract = getContract();
    const counter = await contract.postCounter();
    res.json({ counter: counter.toString() });
  } catch (err) {
    logger.error('Error fetching post counter:', err);
    res.status(500).json({ error: 'Failed to fetch post counter' });
  }
});

// Get on-chain post data
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const contract = getContract();
    const post = await contract.getPost(postId);
    
    res.json({
      id: post[0].toString(),
      author: post[1],
      contentHash: post[2],
      timestamp: post[3].toString(),
    });
  } catch (err) {
    logger.error('Error fetching on-chain post:', err);
    res.status(500).json({ error: 'Failed to fetch on-chain post' });
  }
});

// Get on-chain profile
router.get('/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const contract = getContract();
    const profile = await contract.getProfile(address);
    
    res.json({
      userAddress: profile[0],
      username: profile[1],
      profileHash: profile[2],
    });
  } catch (err) {
    logger.error('Error fetching on-chain profile:', err);
    res.status(500).json({ error: 'Failed to fetch on-chain profile' });
  }
});

// Get transaction status
router.get('/tx/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(hash);
    
    if (!receipt) {
      return res.json({ status: 'pending' });
    }
    
    res.json({
      status: receipt.status === 1 ? 'success' : 'failed',
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
    });
  } catch (err) {
    logger.error('Error fetching transaction:', err);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

module.exports = router;
