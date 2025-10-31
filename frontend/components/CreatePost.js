import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PhotoIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CONTRACT_ABI = [
  'function createPost(string memory _contentHash) public returns (uint256)',
  'function postCounter() public view returns (uint256)',
  'event PostCreated(uint256 indexed postId, address indexed author, string contentHash, uint256 timestamp)',
];

export default function CreatePost() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (!walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating post...');

    try {
      // Create content hash using ethers v5 syntax (utils.id instead of id)
      const contentHash = ethers.utils.id(content);

      // Prepare contract interaction
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Create post on blockchain
      toast.loading('Sending blockchain transaction... ⛓️', { id: toastId });
      const tx = await contract.createPost(contentHash);
      
      toast.loading('Waiting for confirmation... ⏳', { id: toastId });
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      
      // SIMPLE APPROACH: Just query postCounter after transaction
      // This is the most reliable method - no event parsing needed!
      toast.loading('Getting post ID from blockchain... 🔍', { id: toastId });
      
      const blockchainPostId = (await contract.postCounter()).toNumber();
      
      console.log('🎉 Post created on blockchain with ID:', blockchainPostId);
      console.log('📋 Transaction hash:', receipt.transactionHash);

      // Save to backend database with blockchain post ID
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts`, {
        postId: blockchainPostId,
        authorAddress: address,
        contentHash,
        contentText: content,
        mediaUrls: imagePreview || '',
        transactionHash: receipt.transactionHash,
      });

      toast.success('Post created successfully! 🎉', { id: toastId });
      setContent('');
      setImagePreview(null);
      setImageFile(null);
      
      // Reload page to show new post
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error creating post:', error);
      
      // Check if error is about missing profile
      if (error.reason && error.reason.includes('Create profile first')) {
        toast.error('⚠️ Please create your profile first! Go to your profile page and click "Edit Profile" to create your blockchain profile.', { 
          id: toastId,
          duration: 6000 
        });
      } else if (error.message && error.message.includes('user rejected')) {
        toast.error('Transaction rejected by user', { id: toastId });
      } else {
        const errorMsg = error.reason || error.message || 'Failed to create post';
        toast.error(errorMsg, { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">
                {address?.slice(2, 4).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? (Encrypted with FHE) 🔐"
              className="textarea h-24"
              maxLength={500}
              disabled={loading}
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4 relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="rounded-lg max-h-64 w-auto border-2 border-yellow-400" 
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  disabled={loading}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <div className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-lg hover:bg-gray-700">
                    <PhotoIcon className="w-6 h-6" />
                  </div>
                </label>
                <span className="text-sm text-gray-500">
                  {content.length}/500
                </span>
              </div>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Posting...' : 'Post'}</span>
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
