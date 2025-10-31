import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function TrendingUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingUsers();
  }, []);

  const fetchTrendingUsers = async () => {
    try {
      // Fetch real users from backend, sorted by follower count
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/trending`);
      setUsers(response.data.slice(0, 5)); // Top 5 users
    } catch (error) {
      console.error('Error fetching trending users:', error);
      // If API fails, show empty state
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <SparklesIcon className="w-6 h-6 text-aura-primary" />
          <h3 className="font-bold text-white text-lg">Trending Users</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <SparklesIcon className="w-6 h-6 text-aura-primary" />
          <h3 className="font-bold text-white text-lg">Trending Users</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400">No users yet. Be the first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <SparklesIcon className="w-6 h-6 text-aura-primary animate-pulse" />
        <h3 className="font-bold text-white text-lg">Trending Users</h3>
      </div>

      <div className="space-y-3">
        {users.map((user, index) => (
          <Link
            key={user.address}
            href={`/profile/${user.address}`}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
          >
            <div className="flex-shrink-0">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover border-2 border-aura-primary"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aura-primary to-aura-secondary flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate group-hover:text-aura-primary transition-colors">
                {user.username || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
              </p>
              <p className="text-gray-500 text-xs">
                {user.follower_count || 0} followers
              </p>
            </div>
            <div className="badge bg-gradient-to-r from-aura-primary to-aura-secondary text-white text-xs font-bold px-2 py-1">
              #{index + 1}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-center text-sm text-gray-500">
          🔥 Most followed this week
        </p>
      </div>
    </div>
  );
}
