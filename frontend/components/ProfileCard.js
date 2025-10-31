import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { UserIcon, UsersIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function ProfileCard({ address }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/profile/${address}`
        );
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchProfile();
    }
  }, [address]);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/profile/${address}`}>
      <div className="card card-hover text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-aura-primary to-aura-primary flex items-center justify-center mx-auto mb-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full rounded-full"
            />
          ) : (
            <span className="text-white font-bold text-2xl">
              {profile?.username?.[0]?.toUpperCase() || address.slice(2, 4).toUpperCase()}
            </span>
          )}
        </div>

        {/* Username */}
        <h3 className="font-bold text-white text-lg mb-1">
          {profile?.username || `${address.slice(0, 6)}...${address.slice(-4)}`}
        </h3>

        {/* Address */}
        <p className="text-gray-500 text-sm mb-4">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-gray-400 text-sm mb-4">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
          <div>
            <div className="flex justify-center mb-1">
              <DocumentTextIcon className="w-5 h-5 text-aura-primary" />
            </div>
            <p className="text-white font-bold">{profile?.stats?.posts || 0}</p>
            <p className="text-gray-500 text-xs">Posts</p>
          </div>
          <div>
            <div className="flex justify-center mb-1">
              <UsersIcon className="w-5 h-5 text-aura-primary" />
            </div>
            <p className="text-white font-bold">{profile?.stats?.followers || 0}</p>
            <p className="text-gray-500 text-xs">Followers</p>
          </div>
          <div>
            <div className="flex justify-center mb-1">
              <UserIcon className="w-5 h-5 text-aura-primary" />
            </div>
            <p className="text-white font-bold">{profile?.stats?.following || 0}</p>
            <p className="text-gray-500 text-xs">Following</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
