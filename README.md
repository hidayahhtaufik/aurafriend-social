# Aura Social - Decentralized Social Media Platform

A privacy-focused social media platform built on Ethereum with fully homomorphic encryption (FHE) capabilities powered by Aura's fhEVM.

## Features

- **Decentralized Profile Management** - Create and manage your profile on-chain
- **Private Interactions** - Like, comment, and tip with encrypted data
- **Content Sharing** - Post and share content with cryptographic verification
- **Follow System** - Build your network with on-chain social graphs
- **Tip System** - Support creators with direct ETH transfers
- **Notifications** - Real-time updates on platform activities

## Tech Stack

### Smart Contracts
- Solidity ^0.8.24
- OpenZeppelin Contracts
- Hardhat Development Environment

### Frontend
- Next.js 14
- React 18
- TailwindCSS
- RainbowKit (Wallet Connection)
- Wagmi (Ethereum Interactions)
- Aura FHE Relayer SDK

### Backend
- Node.js + Express
- SQLite Database
- RESTful API

## Project Structure

```
/
├── contracts/          # Smart contracts
│   ├── contracts/     # Solidity files
│   ├── scripts/       # Deployment scripts
│   └── hardhat.config.js
├── frontend/          # Next.js application
│   ├── components/    # React components
│   ├── pages/        # Next.js pages
│   ├── lib/          # Utilities (FHE encryption)
│   └── styles/       # CSS styles
└── backend/          # Express API
    ├── routes/       # API endpoints
    ├── database/     # Database configuration
    └── utils/        # Helper functions
```

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH (for deployment)

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd aura-social
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install individually
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 3. Environment Setup

#### Contracts (.env)
```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env`:
```env
SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Frontend (.env.local)
```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
NEXT_PUBLIC_SEPOLIA_RPC_URL=your_sepolia_rpc_url
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

## Deployment

### 1. Deploy Smart Contract

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed contract address and update `frontend/.env.local`.

### 2. Start Backend

```bash
cd backend
npm start
```

Backend will run on `http://localhost:3001`

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## Usage

### Connect Wallet
1. Open `http://localhost:3000`
2. Click "Connect Wallet"
3. Connect MetaMask (Sepolia network)

### Create Profile
1. Navigate to profile section
2. Enter username and profile details
3. Confirm transaction

### Create Post
1. Click "Create Post"
2. Enter content
3. Confirm transaction
4. Post will appear on timeline

### Interact
- **Like**: Click heart icon (encrypted)
- **Comment**: Add comment below post
- **Tip**: Send ETH to post author
- **Share**: Repost content to your timeline

## API Documentation

### Backend Endpoints

#### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post

#### Users
- `GET /api/users/:address` - Get user profile
- `POST /api/users` - Create user profile
- `PUT /api/users/:address` - Update profile

#### Interactions
- `POST /api/interactions/like` - Record like
- `POST /api/interactions/comment` - Record comment
- `POST /api/interactions/tip` - Record tip

#### Notifications
- `GET /api/notifications/:address` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Smart Contract Functions

### Core Functions

```solidity
// Profile Management
function createProfile(string username, string profileHash)
function updateProfile(string username, string profileHash)

// Content Management
function createPost(string contentHash) returns (uint256)
function commentOnPost(uint256 postId, string commentHash)
function sharePost(uint256 postId, string additionalContent)

// Interactions
function likePost(uint256 postId, bytes32 encryptedLike, bytes proof)
function tipUser(address to, bytes32 encryptedAmount, bytes proof) payable

// Social Graph
function followUser(address userToFollow)
function unfollowUser(address userToUnfollow)
```

## FHE Encryption

The platform uses Aura's FHE for private interactions:

```javascript
import { encryptBool, encryptUint64 } from '@/lib/fhe';

// Encrypt like (boolean)
const { handle, inputProof } = await encryptBool(
  true, 
  contractAddress, 
  userAddress
);

// Encrypt tip amount (uint64)
const { handle, inputProof } = await encryptUint64(
  amount, 
  contractAddress, 
  userAddress
);
```

## Development

### Run Tests

```bash
cd contracts
npx hardhat test
```

### Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### Local Development

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Hardhat Node (optional)
cd contracts && npx hardhat node
```

## Security

- Smart contracts inherit OpenZeppelin's audited contracts
- FHE encryption for sensitive data
- Private keys never exposed to frontend
- Input validation on all API endpoints
- SQL injection protection
- XSS prevention

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Repository Issues]
- Documentation: [Project Wiki]

## Acknowledgments

- Aura for FHE technology
- OpenZeppelin for secure contract libraries
- Ethereum Foundation
- Next.js team

---

Built with ❤️ by Auranode
