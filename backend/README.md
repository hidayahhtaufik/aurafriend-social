# Aura Social DApp Backend

Backend API for the Aura Social DApp with SQLite database and FHE integration.

## Features

- RESTful API for all social media operations
- SQLite database (embedded, no external DB needed)
- Rate limiting and security middleware
- Integration with Aura FHE smart contracts
- Comprehensive logging with Winston

## Setup

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
PORT=5000
NODE_ENV=development
SEPOLIA_RPC_URL=https://lb.drpc.org/ogrpc?network=sepolia&dkey=YOUR_DRPC_KEY
CONTRACT_ADDRESS=0x... (from deployment)
DATABASE_PATH=./database.sqlite
FRONTEND_URL=http://localhost:3000
```

### 3. Initialize Database
```bash
npm run init-db
```

### 4. Start Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```

### Users
```
POST   /api/users/profile              # Create/update profile
GET    /api/users/profile/:address     # Get user profile
GET    /api/users/:address/followers   # Get followers
GET    /api/users/:address/following   # Get following
GET    /api/users/:follower/follows/:following  # Check follow status
GET    /api/users/search/:query        # Search users
```

### Posts
```
POST   /api/posts                      # Create post
GET    /api/posts/timeline             # Get timeline (all posts)
GET    /api/posts/:postId              # Get single post
GET    /api/posts/user/:address        # Get user's posts
GET    /api/posts/feed/:address        # Get personalized feed
```

### Interactions
```
POST   /api/interactions/like          # Like post
DELETE /api/interactions/like          # Unlike post
GET    /api/interactions/like/:postId/:userAddress  # Check like status
POST   /api/interactions/comment       # Add comment
GET    /api/interactions/comments/:postId  # Get post comments
POST   /api/interactions/follow        # Follow user
DELETE /api/interactions/follow        # Unfollow user
POST   /api/interactions/tip           # Send tip
GET    /api/interactions/tips/:address # Get received tips
POST   /api/interactions/share         # Share post
```

### Contract
```
GET    /api/contract/address           # Get contract address
GET    /api/contract/abi               # Get contract ABI
GET    /api/contract/post-counter      # Get post counter
GET    /api/contract/post/:postId      # Get on-chain post
GET    /api/contract/profile/:address  # Get on-chain profile
GET    /api/contract/tx/:hash          # Get transaction status
```

## Database Schema

### Tables
- **users** - User profiles
- **posts** - Posts with content
- **likes** - Like interactions
- **comments** - Comments on posts
- **follows** - Follow relationships
- **tips** - Tip transactions
- **shares** - Post shares

## Security

- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting (100 req/15min)
- Input validation with Joi
- SQL injection prevention

## Logging

Logs are stored in:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

Console output in development mode.

## Created with ❤️ by Auranode
