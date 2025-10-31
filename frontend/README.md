# Aura Social DApp Frontend

Modern, responsive frontend for the Aura Social DApp built with Next.js 14.

## Features

- 📱 Instagram-like interface
- 🔐 RainbowKit wallet integration
- ⚡ Server-side rendering (no hydration errors!)
- 🎨 Beautiful Aura & Auranode styling
- 📊 Real-time updates
- 💫 Smooth animations with Framer Motion

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... (from deployment)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://lb.drpc.org/ogrpc?network=sepolia&dkey=YOUR_DRPC_KEY
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id (from https://cloud.walletconnect.com)
```

### 3. Start Development Server
```bash
npm run dev
```

Application runs on `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── pages/
│   ├── _app.js              # App wrapper with providers
│   ├── _document.js         # HTML document
│   ├── index.js             # Home page (timeline)
│   └── profile/
│       └── [address].js     # User profile page
├── components/
│   ├── Layout.js            # Main layout
│   ├── Navbar.js            # Navigation bar
│   ├── Timeline.js          # Post timeline
│   ├── CreatePost.js        # Post creation
│   ├── Post.js              # Single post
│   ├── ProfileCard.js       # User profile card
│   ├── UserProfile.js       # Full user profile
│   ├── UserPosts.js         # User's posts list
│   └── TrendingUsers.js     # Trending users widget
├── styles/
│   └── globals.css          # Global styles
├── server.js                # Custom server
├── next.config.js           # Next.js config
└── tailwind.config.js       # Tailwind config
```

## Key Components

### Layout
Main layout wrapper with navigation and footer.

### Navbar
- Wallet connection button
- Navigation links
- Mobile responsive menu

### Timeline
- Displays all posts
- Infinite scroll ready
- Real-time updates

### CreatePost
- Post creation form
- Blockchain interaction
- Loading states

### Post
- Like/comment/share/tip actions
- Encrypted interactions
- User information

### ProfileCard
- User stats
- Quick profile view
- Navigate to full profile

### UserProfile
- Full profile view
- Edit profile functionality
- Follow/unfollow

## Styling

### Theme Colors
- Aura Primary: `#6C5CE7`
- Aura Secondary: `#A29BFE`
- Aura Primary: `#667EEA`
- Aura Secondary: `#764BA2`

### Gradients
- Aura Gradient: `linear-gradient(135deg, #667EEA 0%, #764BA2 100%)`
- Aura Gradient: `linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)`

### Custom Classes
- `.card` - Card container
- `.card-hover` - Card with hover effects
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-outline` - Outline button
- `.input` - Input field
- `.textarea` - Textarea field
- `.gradient-text` - Gradient text

## No Hydration Errors! 🎉

The app is specifically configured to prevent hydration errors:

1. **Mounted State Pattern**
   ```javascript
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   if (!mounted) return null;
   ```

2. **Proper SSR Configuration**
   - Client-only wallet connections
   - Conditional rendering
   - Next.js 14 best practices

3. **Wallet Integration**
   - RainbowKit properly configured
   - wagmi hooks used correctly
   - No server-side wallet calls

## Performance

- Code splitting with Next.js
- Image optimization
- CSS purging with Tailwind
- Lazy loading components

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Created with ❤️ by Auranode
