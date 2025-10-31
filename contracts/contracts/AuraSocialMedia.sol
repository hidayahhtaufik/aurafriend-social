// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool, externalEuint32, externalEuint64, externalEbool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZamaSocialMedia
 * @notice Social Media DApp with Fully Homomorphic Encryption using Zama's fhEVM
 * @dev All interactions (likes, tips, comments) are encrypted for privacy
 * @dev Uses @fhevm/solidity v0.8.0 with SepoliaConfig for proper Sepolia deployment
 * Created with ❤️ by Auranode
 */
contract ZamaSocialMedia is SepoliaConfig, Ownable {
    // Encrypted data types
    struct Post {
        uint256 id;
        address author;
        string contentHash; // IPFS hash or encrypted content reference
        euint32 encryptedLikeCount;
        euint32 encryptedCommentCount;  // 🔐 FHE encrypted comment count
        euint32 encryptedShareCount;    // 🔐 FHE encrypted share count
        uint256 timestamp;
        bool exists;
    }

    struct UserProfile {
        address userAddress;
        string username;
        string profileHash; // IPFS hash
        euint32 encryptedFollowerCount;
        euint32 encryptedFollowingCount;
        bool exists;
    }

    struct Comment {
        uint256 id;
        uint256 postId;
        address commenter;
        string commentHash;
        uint256 timestamp;
    }

    struct Tip {
        address from;
        address to;
        euint64 encryptedAmount;
        uint256 timestamp;
    }

    // State variables
    uint256 public postCounter;
    uint256 public commentCounter;

    mapping(uint256 => Post) public posts;
    mapping(address => UserProfile) public profiles;
    mapping(uint256 => mapping(address => ebool)) private postLikes; // postId => user => hasLiked (encrypted)
    mapping(address => mapping(address => ebool)) private following; // follower => following => isFollowing (encrypted)
    mapping(uint256 => Comment[]) public postComments;
    mapping(address => uint256[]) public userPosts;
    mapping(address => Tip[]) public userTips;

    // Events
    event PostCreated(uint256 indexed postId, address indexed author, string contentHash, uint256 timestamp);
    event PostLiked(uint256 indexed postId, address indexed liker);
    event PostCommented(uint256 indexed postId, uint256 commentId, address indexed commenter);
    event PostShared(uint256 indexed originalPostId, uint256 newPostId, address indexed sharer);
    event TipSent(address indexed from, address indexed to, uint256 timestamp);
    event UserFollowed(address indexed follower, address indexed following);
    event ProfileCreated(address indexed user, string username);

    constructor() Ownable(msg.sender) {
        postCounter = 0;
        commentCounter = 0;
    }

    // User Profile Functions
    function createProfile(string memory _username, string memory _profileHash) external {
        require(!profiles[msg.sender].exists, "Profile already exists");
        
        // Create encrypted values with proper ACL handling (FHE library)
        euint32 followerCount = FHE.asEuint32(0);
        euint32 followingCount = FHE.asEuint32(0);
        
        // Grant access properly
        FHE.allowThis(followerCount);
        FHE.allowThis(followingCount);
        FHE.allow(followerCount, msg.sender);
        FHE.allow(followingCount, msg.sender);
        
        profiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            username: _username,
            profileHash: _profileHash,
            encryptedFollowerCount: followerCount,
            encryptedFollowingCount: followingCount,
            exists: true
        });

        emit ProfileCreated(msg.sender, _username);
    }

    function updateProfile(string memory _username, string memory _profileHash) external {
        require(profiles[msg.sender].exists, "Profile does not exist");
        
        profiles[msg.sender].username = _username;
        profiles[msg.sender].profileHash = _profileHash;
    }

    // Post Functions
    function createPost(string memory _contentHash) public returns (uint256) {
        require(profiles[msg.sender].exists, "Create profile first");
        
        postCounter++;
        uint256 newPostId = postCounter;

        // Create encrypted counters with proper ACL
        euint32 likeCount = FHE.asEuint32(0);
        euint32 commentCount = FHE.asEuint32(0);
        euint32 shareCount = FHE.asEuint32(0);
        
        FHE.allowThis(likeCount);
        FHE.allowThis(commentCount);
        FHE.allowThis(shareCount);
        
        FHE.allow(likeCount, msg.sender);
        FHE.allow(commentCount, msg.sender);
        FHE.allow(shareCount, msg.sender);

        posts[newPostId] = Post({
            id: newPostId,
            author: msg.sender,
            contentHash: _contentHash,
            encryptedLikeCount: likeCount,
            encryptedCommentCount: commentCount,
            encryptedShareCount: shareCount,
            timestamp: block.timestamp,
            exists: true
        });

        userPosts[msg.sender].push(newPostId);

        emit PostCreated(newPostId, msg.sender, _contentHash, block.timestamp);
        return newPostId;
    }

    // Like Functions (Encrypted)
    function likePost(uint256 _postId, externalEbool encryptedLike, bytes calldata inputProof) external {
        require(posts[_postId].exists, "Post does not exist");
        
        // Convert external encrypted input
        ebool like = FHE.fromExternal(encryptedLike, inputProof);
        postLikes[_postId][msg.sender] = like;

        // Update encrypted like count
        euint32 one = FHE.asEuint32(1);
        FHE.allowThis(one);
        
        euint32 increment = FHE.select(like, one, FHE.asEuint32(0));
        FHE.allowThis(increment);
        
        posts[_postId].encryptedLikeCount = FHE.add(posts[_postId].encryptedLikeCount, increment);
        FHE.allowThis(posts[_postId].encryptedLikeCount);
        FHE.allow(posts[_postId].encryptedLikeCount, msg.sender);
        FHE.allow(posts[_postId].encryptedLikeCount, posts[_postId].author);

        emit PostLiked(_postId, msg.sender);
    }

    // Comment Functions (with FHE encrypted count)
    function commentOnPost(uint256 _postId, string memory _commentHash) external returns (uint256) {
        require(posts[_postId].exists, "Post does not exist");
        require(profiles[msg.sender].exists, "Create profile first");
        
        commentCounter++;
        uint256 newCommentId = commentCounter;

        Comment memory newComment = Comment({
            id: newCommentId,
            postId: _postId,
            commenter: msg.sender,
            commentHash: _commentHash,
            timestamp: block.timestamp
        });

        postComments[_postId].push(newComment);
        
        // 🔐 Increment encrypted comment count
        euint32 one = FHE.asEuint32(1);
        FHE.allowThis(one);
        
        posts[_postId].encryptedCommentCount = FHE.add(posts[_postId].encryptedCommentCount, one);
        FHE.allowThis(posts[_postId].encryptedCommentCount);
        FHE.allow(posts[_postId].encryptedCommentCount, msg.sender);
        FHE.allow(posts[_postId].encryptedCommentCount, posts[_postId].author);

        emit PostCommented(_postId, newCommentId, msg.sender);
        return newCommentId;
    }

    // Share Functions (with FHE encrypted count)
    function sharePost(uint256 _originalPostId, string memory _additionalContent) external returns (uint256) {
        require(posts[_originalPostId].exists, "Original post does not exist");
        require(profiles[msg.sender].exists, "Create profile first");
        
        // 🔐 Increment encrypted share count on original post
        euint32 one = FHE.asEuint32(1);
        FHE.allowThis(one);
        
        posts[_originalPostId].encryptedShareCount = FHE.add(posts[_originalPostId].encryptedShareCount, one);
        FHE.allowThis(posts[_originalPostId].encryptedShareCount);
        FHE.allow(posts[_originalPostId].encryptedShareCount, msg.sender);
        FHE.allow(posts[_originalPostId].encryptedShareCount, posts[_originalPostId].author);
        
        // Create new post with reference to original
        string memory shareContent = string(abi.encodePacked("SHARED:", _additionalContent, ":", posts[_originalPostId].contentHash));
        uint256 newPostId = createPost(shareContent);

        emit PostShared(_originalPostId, newPostId, msg.sender);
        return newPostId;
    }

    // Tip Functions (Encrypted amounts)
    function tipUser(address _to, externalEuint64 encryptedAmount, bytes calldata inputProof) external payable {
        require(profiles[_to].exists, "Recipient profile does not exist");
        require(msg.value > 0, "Must send ETH");
        
        // Convert encrypted tip amount
        euint64 tipAmount = FHE.fromExternal(encryptedAmount, inputProof);
        FHE.allowThis(tipAmount);
        FHE.allow(tipAmount, msg.sender);
        FHE.allow(tipAmount, _to);

        userTips[_to].push(Tip({
            from: msg.sender,
            to: _to,
            encryptedAmount: tipAmount,
            timestamp: block.timestamp
        }));

        // Transfer ETH
        (bool success, ) = _to.call{value: msg.value}("");
        require(success, "Transfer failed");

        emit TipSent(msg.sender, _to, block.timestamp);
    }

    // Follow Functions (Encrypted)
    function followUser(address _userToFollow, externalEbool encryptedFollow, bytes calldata inputProof) external {
        require(profiles[_userToFollow].exists, "User does not exist");
        require(msg.sender != _userToFollow, "Cannot follow yourself");
        
        ebool isFollowing = FHE.fromExternal(encryptedFollow, inputProof);
        following[msg.sender][_userToFollow] = isFollowing;

        // Update follower counts
        euint32 one = FHE.asEuint32(1);
        FHE.allowThis(one);
        
        euint32 increment = FHE.select(isFollowing, one, FHE.asEuint32(0));
        FHE.allowThis(increment);
        
        profiles[_userToFollow].encryptedFollowerCount = FHE.add(
            profiles[_userToFollow].encryptedFollowerCount,
            increment
        );
        profiles[msg.sender].encryptedFollowingCount = FHE.add(
            profiles[msg.sender].encryptedFollowingCount,
            increment
        );

        FHE.allowThis(profiles[_userToFollow].encryptedFollowerCount);
        FHE.allowThis(profiles[msg.sender].encryptedFollowingCount);
        FHE.allow(profiles[_userToFollow].encryptedFollowerCount, _userToFollow);
        FHE.allow(profiles[msg.sender].encryptedFollowingCount, msg.sender);

        emit UserFollowed(msg.sender, _userToFollow);
    }

    // View Functions
    function getPost(uint256 _postId) external view returns (
        uint256 id,
        address author,
        string memory contentHash,
        uint256 timestamp
    ) {
        require(posts[_postId].exists, "Post does not exist");
        Post memory post = posts[_postId];
        return (post.id, post.author, post.contentHash, post.timestamp);
    }

    function getUserPosts(address _user) external view returns (uint256[] memory) {
        return userPosts[_user];
    }

    function getPostComments(uint256 _postId) external view returns (Comment[] memory) {
        return postComments[_postId];
    }

    function getUserTips(address _user) external view returns (uint256) {
        return userTips[_user].length;
    }

    function getProfile(address _user) external view returns (
        address userAddress,
        string memory username,
        string memory profileHash
    ) {
        require(profiles[_user].exists, "Profile does not exist");
        UserProfile memory profile = profiles[_user];
        return (profile.userAddress, profile.username, profile.profileHash);
    }

    // Encrypted data access (requires permission)
    function getEncryptedLikeCount(uint256 _postId) external view returns (euint32) {
        require(posts[_postId].exists, "Post does not exist");
        return posts[_postId].encryptedLikeCount;
    }
    
    function getEncryptedCommentCount(uint256 _postId) external view returns (euint32) {
        require(posts[_postId].exists, "Post does not exist");
        return posts[_postId].encryptedCommentCount;
    }
    
    function getEncryptedShareCount(uint256 _postId) external view returns (euint32) {
        require(posts[_postId].exists, "Post does not exist");
        return posts[_postId].encryptedShareCount;
    }

    function getEncryptedFollowerCount(address _user) external view returns (euint32) {
        require(profiles[_user].exists, "Profile does not exist");
        return profiles[_user].encryptedFollowerCount;
    }

    receive() external payable {}
}
