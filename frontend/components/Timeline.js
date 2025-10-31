import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import Post from './Post';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Timeline() {
  const { address } = useAccount();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/timeline?limit=20&offset=0`
      );
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchPosts();
    }
  }, [address]);

  const handleRefresh = () => {
    fetchPosts(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/6"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Timeline</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 text-gray-400 hover:text-aura-primary transition-colors"
        >
          <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => <Post key={post.post_id} post={post} onUpdate={fetchPosts} />)
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-lg">No posts yet. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
}
