import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { Bars3Icon, XMarkIcon, HomeIcon, UserIcon, BellIcon } from '@heroicons/react/24/outline';
import Notifications from './Notifications';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (address) {
      fetchUnreadCount();
      // Poll for new notifications every 10 seconds
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${address}/count`
      );
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-yellow-400/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-blue-600 flex items-center justify-center shadow-lg animate-glow">
              <span className="text-white font-bold text-2xl">🔐</span>
            </div>
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-blue-400 hidden sm:block">
              AURAFRIEND
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isConnected && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  router.pathname === '/'
                    ? 'bg-gradient-to-r from-yellow-400 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link
                href={`/profile/${address}`}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  router.pathname.includes('/profile')
                    ? 'bg-gradient-to-r from-yellow-400 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              
              {/* Notifications Bell */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                <Notifications 
                  isOpen={notificationsOpen} 
                  onClose={() => {
                    setNotificationsOpen(false);
                    fetchUnreadCount();
                  }} 
                />
              </div>
            </div>
          )}

          {/* Connect Button */}
          <div className="flex items-center space-x-4">
            <ConnectButton
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />

            {/* Mobile menu button */}
            {isConnected && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isConnected && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg ${
                  router.pathname === '/'
                    ? 'bg-gradient-to-r from-yellow-400 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <HomeIcon className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link
                href={`/profile/${address}`}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg ${
                  router.pathname.includes('/profile')
                    ? 'bg-gradient-to-r from-yellow-400 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              
              {/* Mobile Notifications */}
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800"
              >
                <BellIcon className="w-5 h-5" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
