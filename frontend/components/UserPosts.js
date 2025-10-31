import { useState, useEffect } from 'react';
import axios from 'axios';
import Post from './Post';

export default function UserPosts({ address }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/user/${address}?limit=20&offset=0`
        );
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchPosts();
    }
  }, [address]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Posts</h2>
      {posts.length > 0 ? (
        posts.map((post) => <Post key={post.post_id} post={post} />)
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-400">No posts yet</p>
        </div>
      )}
    </div>
  );
}
