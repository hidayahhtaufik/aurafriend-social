import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  UserPlusIcon,
  CurrencyDollarIcon,
  ShareIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function Notifications({ isOpen, onClose }) {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && address) {
      fetchNotifications();
    }
  }, [isOpen, address]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${address}?limit=20`
      );
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${address}/read-all`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlusIcon className="w-5 h-5 text-green-500" />;
      case 'tip':
        return <CurrencyDollarIcon className="w-5 h-5 text-yellow-500" />;
      case 'share':
        return <ShareIcon className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-gray-800 rounded-xl shadow-2xl border-2 border-yellow-400 z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-yellow-400/10 to-blue-500/10">
        <h3 className="font-bold text-white text-lg">🔔 Notifications</h3>
        <div className="flex items-center space-x-2">
          {notifications.filter(n => !n.is_read).length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${
                !notification.is_read ? 'bg-yellow-400/5' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {notification.avatar_url ? (
                    <img
                      src={notification.avatar_url}
                      alt={notification.username}
                      className="w-10 h-10 rounded-full border-2 border-yellow-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {notification.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getIcon(notification.type)}
                    <Link
                      href={`/profile/${notification.from_address}`}
                      className="font-semibold text-white hover:text-yellow-400 text-sm"
                      onClick={onClose}
                    >
                      {notification.username || `${notification.from_address.slice(0, 6)}...`}
                    </Link>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    {notification.message}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-yellow-400 hover:text-yellow-300 text-xs"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-500 hover:text-red-400 text-xs"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-gray-600 text-sm mt-2">
              Interact with others to get notified!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
