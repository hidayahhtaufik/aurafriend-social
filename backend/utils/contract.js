const { ethers } = require('ethers');
const fhevmjs = require('fhevmjs');
require('dotenv').config();

const CONTRACT_ABI = [
  "function createProfile(string memory _username, string memory _profileHash) external",
  "function updateProfile(string memory _username, string memory _profileHash) external",
  "function createPost(string memory _contentHash) external returns (uint256)",
  "function likePost(uint256 _postId, bytes memory encryptedLike, bytes calldata inputProof) external",
  "function commentOnPost(uint256 _postId, string memory _commentHash) external returns (uint256)",
  "function sharePost(uint256 _originalPostId, string memory _additionalContent) external returns (uint256)",
  "function tipUser(address _to, bytes memory encryptedAmount, bytes calldata inputProof) external payable",
  "function followUser(address _userToFollow, bytes memory encryptedFollow, bytes calldata inputProof) external",
  "function getPost(uint256 _postId) external view returns (uint256 id, address author, string memory contentHash, uint256 timestamp)",
  "function getUserPosts(address _user) external view returns (uint256[] memory)",
  "function getPostComments(uint256 _postId) external view returns (tuple(uint256 id, uint256 postId, address commenter, string commentHash, uint256 timestamp)[] memory)",
  "function getProfile(address _user) external view returns (address userAddress, string memory username, string memory profileHash)",
  "function postCounter() external view returns (uint256)",
  "event PostCreated(uint256 indexed postId, address indexed author, string contentHash, uint256 timestamp)",
  "event PostLiked(uint256 indexed postId, address indexed liker)",
  "event PostCommented(uint256 indexed postId, uint256 commentId, address indexed commenter)",
  "event TipSent(address indexed from, address indexed to, uint256 timestamp)",
  "event UserFollowed(address indexed follower, address indexed following)"
];

let provider = null;
let contract = null;
let fhevmInstance = null;

function initContract() {
  if (!process.env.SEPOLIA_RPC_URL || !process.env.CONTRACT_ADDRESS) {
    throw new Error('Missing required environment variables: SEPOLIA_RPC_URL or CONTRACT_ADDRESS');
  }

  provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  return contract;
}

async function initFhevmInstance() {
  if (!fhevmInstance) {
    fhevmInstance = await fhevmjs.createInstance({
      chainId: 11155111, // Sepolia
      publicKey: await getPublicKey(),
    });
  }
  return fhevmInstance;
}

async function getPublicKey() {
  // In production, retrieve from contract or gateway
  // For now, return a placeholder
  return '0x...';
}

function getContract() {
  if (!contract) {
    return initContract();
  }
  return contract;
}

function getProvider() {
  if (!provider) {
    initContract();
  }
  return provider;
}

async function getFhevmInstance() {
  if (!fhevmInstance) {
    return await initFhevmInstance();
  }
  return fhevmInstance;
}

module.exports = {
  initContract,
  getContract,
  getProvider,
  getFhevmInstance,
  CONTRACT_ABI,
};
