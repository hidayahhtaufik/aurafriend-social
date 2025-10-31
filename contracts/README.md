# Aura Social Media Smart Contracts

Smart contracts for the Aura Social DApp using Fully Homomorphic Encryption.

## Contract Overview

### AuraSocialMedia.sol

Main contract implementing all social media features with FHE encryption:

- **User Profiles** - On-chain user profiles with encrypted stats
- **Posts** - Create posts with encrypted like counts
- **Encrypted Likes** - Like posts with FHE-encrypted interactions
- **Comments** - Add comments to posts
- **Shares** - Share posts to your timeline
- **Tips** - Send encrypted ETH tips to users
- **Follow System** - Follow users with encrypted follower counts

## Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
SEPOLIA_RPC_URL=https://lb.drpc.org/ogrpc?network=sepolia&dkey=YOUR_DRPC_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Deploy to Sepolia
```bash
npm run deploy
```

Save the deployed contract address to use in backend and frontend!

## Contract Functions

### Profile Management
- `createProfile(username, profileHash)` - Create user profile
- `updateProfile(username, profileHash)` - Update profile
- `getProfile(address)` - Get profile info

### Posts
- `createPost(contentHash)` - Create new post
- `getPost(postId)` - Get post details
- `getUserPosts(address)` - Get user's posts

### Interactions
- `likePost(postId, encryptedLike, inputProof)` - Like/unlike post (FHE)
- `commentOnPost(postId, commentHash)` - Add comment
- `sharePost(originalPostId, additionalContent)` - Share post
- `tipUser(to, encryptedAmount, inputProof)` - Send encrypted tip (FHE)
- `followUser(userToFollow, encryptedFollow, inputProof)` - Follow user (FHE)

## Testing

```bash
npm run test
```

## Verification

After deployment, verify on Etherscan:
```bash
npm run verify -- <CONTRACT_ADDRESS>
```

## Created with ❤️ by Auranode
