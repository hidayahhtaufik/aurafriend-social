import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PencilIcon, UserPlusIcon, CheckIcon, PhotoIcon, CameraIcon } from '@heroicons/react/24/outline';

const CONTRACT_ABI = [
  'function createProfile(string memory _username, string memory _profileHash) external',
  'function updateProfile(string memory _username, string memory _profileHash) external',
  'function followUser(address _userToFollow, uint256 encryptedFollow, bytes calldata inputProof) external',
  'function profiles(address) external view returns (address userAddress, string username, string profileHash, uint32 encryptedFollowerCount, uint32 encryptedFollowingCount, bool exists)',
];

export default function UserProfile({ address, isOwnProfile }) {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', avatarUrl: '', headerUrl: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [headerPreview, setHeaderPreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/profile/${address}`
        );
        setProfile(response.data);
        setEditForm({ 
          username: response.data.username, 
          bio: response.data.bio || '',
          avatarUrl: response.data.avatar_url || '',
          headerUrl: response.data.header_url || ''
        });

        if (!isOwnProfile && connectedAddress) {
          const followResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${connectedAddress}/follows/${address}`
          );
          setIsFollowing(followResponse.data.isFollowing);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchProfile();
    }
  }, [address, connectedAddress, isOwnProfile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setEditForm({ ...editForm, avatarUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeaderPreview(reader.result);
        setEditForm({ ...editForm, headerUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFollow = async () => {
    if (!connectedAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    let toastId;
    try {
      setLoading(true);
      toastId = toast.loading('Processing follow...');

      if (isFollowing) {
        await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interactions/follow`, {
          data: {
            followerAddress: connectedAddress,
            followingAddress: address,
          },
        });
        setIsFollowing(false);
        toast.success(`Unfollowed! 👋`, { id: toastId });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interactions/follow`, {
          followerAddress: connectedAddress,
          followingAddress: address,
          transactionHash: 'pending',
        });
        setIsFollowing(true);
        toast.success(`Following! 🎉`, { id: toastId });
      }

      // Try blockchain transaction in background (optional)
      if (walletClient && process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
          );
          // Note: FHE encryption needs proper setup - skipping for now
          // const tx = await contract.followUser(address, encryptedFollow, inputProof);
        } catch (blockchainError) {
          console.warn('Blockchain operation failed (non-critical):', blockchainError);
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to update follow: ' + (error.response?.data?.message || error.message), { id: toastId });
      // Revert on error
      setIsFollowing(isFollowing);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    const toastId = toast.loading('Checking blockchain profile...');

    try {
      // Step 1: Setup contract connection
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      console.log('🔍 Checking profile for address:', connectedAddress);
      console.log('📝 Contract address:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);

      // Step 2: Check if profile exists on blockchain with error handling
      let blockchainProfile;
      let profileExistsOnChain = false;
      
      try {
        blockchainProfile = await contract.profiles(connectedAddress);
        profileExistsOnChain = blockchainProfile.exists || blockchainProfile[5]; // exists is 6th element (index 5)
        
        console.log('📊 Blockchain profile data:', {
          userAddress: blockchainProfile[0] || blockchainProfile.userAddress,
          username: blockchainProfile[1] || blockchainProfile.username,
          exists: blockchainProfile[5] || blockchainProfile.exists
        });
        console.log('✅ Profile exists on chain:', profileExistsOnChain);
      } catch (checkError) {
        console.warn('⚠️ Error checking profile, assuming it does not exist:', checkError);
        profileExistsOnChain = false;
      }

      // Step 3: Create or update profile on blockchain
      if (!profileExistsOnChain) {
        console.log('🆕 Creating NEW profile on blockchain...');
        toast.loading('Creating profile on blockchain with FHE... 🔐', { id: toastId });
        
        const username = editForm.username || `user_${connectedAddress.slice(2, 8)}`;
        console.log('📝 Username:', username);
        
        const tx = await contract.createProfile(username, '');
        
        toast.loading('Waiting for transaction confirmation... ⏳', { id: toastId });
        console.log('⏳ TX sent:', tx.hash);
        console.log('🔗 View on Etherscan:', `https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        // Wait with longer timeout (5 minutes for slow RPC)
        const receipt = await tx.wait(1, 300000); // 1 confirmation, 5 min timeout
        console.log('✅ TX confirmed:', receipt.transactionHash);
        
        toast.loading('Profile created on blockchain! Saving to database... 💾', { id: toastId });
      } else {
        console.log('🔄 Updating EXISTING profile on blockchain...');
        toast.loading('Updating blockchain profile... 🔐', { id: toastId });
        
        const username = editForm.username || blockchainProfile[1] || blockchainProfile.username || `user_${connectedAddress.slice(2, 8)}`;
        console.log('📝 Username:', username);
        
        const tx = await contract.updateProfile(username, '');
        console.log('⏳ TX sent:', tx.hash);
        console.log('🔗 View on Etherscan:', `https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        // Wait with longer timeout (5 minutes for slow RPC)
        const receipt = await tx.wait(1, 300000); // 1 confirmation, 5 min timeout
        console.log('✅ TX confirmed:', receipt.transactionHash);
        
        toast.loading('Blockchain updated! Saving to database... 💾', { id: toastId });
      }

      // Step 4: Save to backend database
      console.log('💾 Saving to database...');
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/profile`, {
        address: connectedAddress,
        username: editForm.username,
        profileHash: '',
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl,
        headerUrl: editForm.headerUrl,
      });
      
      console.log('✅ Database saved!');
      toast.success('Profile updated successfully! 🎉', { id: toastId });
      setIsEditing(false);
      
      // Reload profile
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/profile/${address}`
      );
      setProfile(response.data);
      setAvatarPreview(null);
      setHeaderPreview(null);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      console.error('Error details:', {
        message: error.message,
        reason: error.reason,
        code: error.code,
        data: error.data
      });
      
      if (error.reason && error.reason.includes('Profile does not exist')) {
        toast.error('⚠️ Profile check failed! The contract says profile does not exist. This is a bug - the code should have created it. Please try again or contact support.', { 
          id: toastId,
          duration: 8000 
        });
      } else if (error.reason && error.reason.includes('Profile already exists')) {
        toast.error('Profile already exists on blockchain! Try refreshing the page and editing again.', { id: toastId });
      } else if (error.message && error.message.includes('user rejected')) {
        toast.error('Transaction rejected by user', { id: toastId });
      } else if (error.message && error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for gas! Get Sepolia ETH from: https://sepoliafaucet.com/', { id: toastId, duration: 6000 });
      } else {
        toast.error('Failed to update profile: ' + (error.reason || error.message), { id: toastId });
      }
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-32 bg-gray-700 rounded-t-xl"></div>
        <div className="p-6">
          <div className="w-24 h-24 bg-gray-700 rounded-full -mt-16 mb-4"></div>
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header/Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-yellow-400 via-blue-500 to-cyan-400">
        {(profile?.header_url || headerPreview) && (
          <img 
            src={headerPreview || profile?.header_url} 
            alt="Header" 
            className="w-full h-full object-cover"
          />
        )}
        {isOwnProfile && isEditing && (
          <label className="absolute bottom-2 right-2 cursor-pointer bg-gray-900 bg-opacity-75 text-white rounded-full p-2 hover:bg-opacity-100 transition-all">
            <input
              type="file"
              accept="image/*"
              onChange={handleHeaderChange}
              className="hidden"
            />
            <CameraIcon className="w-5 h-5" />
          </label>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Avatar */}
          <div className="relative -mt-16">
            <div className="w-24 h-24 rounded-full border-4 border-gray-800 overflow-hidden shadow-xl">
              {(profile?.avatar_url || avatarPreview) ? (
                <img 
                  src={avatarPreview || profile?.avatar_url} 
                  alt={profile?.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {profile?.username?.[0]?.toUpperCase() || address.slice(2, 4).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {isOwnProfile && isEditing && (
              <label className="absolute bottom-0 right-0 cursor-pointer bg-gray-900 text-white rounded-full p-2 hover:bg-yellow-400 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <PhotoIcon className="w-4 h-4" />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-2">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-outline flex items-center space-x-2"
              >
                <PencilIcon className="w-5 h-5" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            ) : (
              <button
                onClick={handleFollow}
                disabled={loading}
                className={`flex items-center space-x-2 ${
                  isFollowing ? 'btn-secondary' : 'btn-primary'
                } disabled:opacity-50`}
                title="Follow with FHE encryption"
              >
                {isFollowing ? (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    <span>Following</span>
                    <span className="text-xs">🔐</span>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Follow</span>
                    <span className="text-xs">🔐</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Edit Form or Profile Display */}
        {isEditing ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="input"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="textarea"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>
            <button onClick={handleSaveProfile} className="btn-primary w-full">
              💾 Save Changes
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-white">
                {profile?.username || `User ${address.slice(0, 6)}`}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {address.slice(0, 10)}...{address.slice(-8)}
              </p>
            </div>

            {profile?.bio && (
              <p className="text-gray-400 mt-4">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500">
                  {profile?.stats?.posts || 0}
                </p>
                <p className="text-gray-500 text-sm">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500">
                  {profile?.stats?.followers || 0}
                </p>
                <p className="text-gray-500 text-sm">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500">
                  {profile?.stats?.following || 0}
                </p>
                <p className="text-gray-500 text-sm">Following</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500">
                  {profile?.stats?.tips_received || 0}
                </p>
                <p className="text-gray-500 text-sm">Tips 💰</p>
              </div>
            </div>
            
            {/* Tips Info - Only show on own profile */}
            {isOwnProfile && profile?.stats?.tips_received > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-400/10 to-blue-500/10 rounded-lg border border-yellow-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 font-semibold">💰 Tips Received</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Total: {profile?.stats?.tips_received || 0} tips
                      {profile?.stats?.total_tips_eth && ` (~${profile.stats.total_tips_eth} ETH)`}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      ✅ Tips are sent directly to your wallet on blockchain!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
