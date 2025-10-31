import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Timeline from '@/components/Timeline';
import CreatePost from '@/components/CreatePost';
import ProfileCard from '@/components/ProfileCard';
import TrendingUsers from '@/components/TrendingUsers';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-aura-hero animate-gradient mb-3">
            🔐 AURAFRIEND 🔐
          </h1>
          <p className="text-xl text-yellow-400 font-semibold mb-2">
            Your Private Social Network
          </p>
          <p className="text-gray-300 mt-2">
            Powered by Aura FHE - Fully Homomorphic Encryption
          </p>
          <p className="text-sm text-blue-400 mt-1 font-semibold">
            Created with ❤️ by Auranode
          </p>
        </div>

        {isConnected ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Profile */}
            <div className="lg:col-span-3">
              <div className="sticky top-6">
                <ProfileCard address={address} />
              </div>
            </div>

            {/* Main Content - Timeline */}
            <div className="lg:col-span-6">
              <CreatePost />
              <Timeline />
            </div>

            {/* Right Sidebar - Trending */}
            <div className="lg:col-span-3">
              <div className="sticky top-6">
                <TrendingUsers />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gradient-to-r from-yellow-400 to-blue-600 p-1 rounded-3xl inline-block mb-6 animate-glow">
              <div className="bg-gray-900 rounded-3xl px-16 py-12">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-blue-400 mb-4">
                  Welcome to AURAFRIEND! 👋
                </h2>
                <p className="text-xl text-gray-300 mb-6">
                  Connect your wallet to start using the most private social network
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center space-x-2 bg-gray-800 p-3 rounded-lg">
                    <span className="text-2xl">🔒</span>
                    <span>Encrypted Likes</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 bg-gray-800 p-3 rounded-lg">
                    <span className="text-2xl">💰</span>
                    <span>Private Tips</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 bg-gray-800 p-3 rounded-lg">
                    <span className="text-2xl">✨</span>
                    <span>FHE Powered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
