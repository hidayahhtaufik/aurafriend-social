import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import UserProfile from '@/components/UserProfile';
import UserPosts from '@/components/UserPosts';

export default function ProfilePage() {
  const router = useRouter();
  const { address: userAddress } = router.query;
  const { address: connectedAddress } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !userAddress) {
    return null;
  }

  const isOwnProfile = connectedAddress?.toLowerCase() === userAddress?.toLowerCase();

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserProfile address={userAddress} isOwnProfile={isOwnProfile} />
        <div className="mt-8">
          <UserPosts address={userAddress} />
        </div>
      </div>
    </div>
  );
}
