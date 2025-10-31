import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
// ⚠️ CRITICAL: NO fhe import at top level! Causes WASM error!
// FHE functions will be dynamically imported when needed
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const CONTRACT_ABI = [
  // Updated to use bytes32 for FHE encrypted handles (externalEbool, externalEuint64)
  'function likePost(uint256 _postId, bytes32 encryptedLike, bytes calldata inputProof) external',
  'function commentOnPost(uint256 _postId, string memory _commentHash) external returns (uint256)',
  'function sharePost(uint256 _originalPostId, string memory _additionalContent) public returns (uint256)',
  'function tipUser(address _to, bytes32 encryptedAmount, bytes calldata inputProof) external payable',
  'function posts(uint256) external view returns (uint256 id, address author, string contentHash, uint256 timestamp, bool exists)',
  'function postCounter() public view returns (uint256)',
  'function getEncryptedLikeCount(uint256 _postId) external view returns (uint32)',
  'function getEncryptedCommentCount(uint256 _postId) external view returns (uint32)',
  'function getEncryptedShareCount(uint256 _postId) external view returns (uint32)',
  'event PostCreated(uint256 indexed postId, address indexed author, string contentHash, uint256 timestamp)',
  'event PostShared(uint256 indexed originalPostId, uint256 newPostId, address indexed sharer)',
];

export default function Post({ post, onUpdate }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has liked this post
    if (address) {
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interactions/like/${post.post_id}/${address}`)
        .then(res => setLiked(res.data.hasLiked))
        .catch(err => console.error('Error checking like:', err));
    }
  }, [address, post.post_id]);

  const handleLike = async () => {
    if (!walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    let toastId;
    try {
      setLoading(true);
      toastId = toast.loading('Processing like with blockchain... 🔐');

      // Prepare contract interaction
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      toast.loading('Encrypting like with FHE... 🔐', { id: toastId });
      
      // Dynamically import FHE library (client-side only, prevents SSR WASM issues)
      const { encryptBool } = await import('@/lib/fhe');
      
      // Proper FHE encryption using fhevmjs
      const { handle, inputProof } = await encryptBool(
        !liked, // true for like, false for unlike
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        address
      );

      toast.loading('Sending blockchain transaction... ⛓️', { id: toastId });
      
      console.log('👍 Liking post with blockchain ID:', post.post_id);
      
      // Call contract with properly encrypted data
      const tx = await contract.likePost(post.post_id, handle, inputProof, {
        gasLimit: 500000 // Manual gas limit for FHE operations
      });
      
      toast.loading('Waiting for confirmation... ⏳', { id: toastId });
      const receipt = await tx.wait();

      // Update backend after blockchain success
      if (!liked) {
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interactions/like`, {
          postId: post.post_id,
          userAddress: address,
          transactionHash: receipt.transactionHash,
        });
      } else {
        await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interactions/like`, {
          data: { postId: post.post_id, userAddress: address },
        });
      }

      // Update UI
      setLiked(!liked);

      toast.success(`Post ${liked ? 'unliked' : 'liked'}! ❤️ TX: ${receipt.transactionHash.slice(0, 10)}...`, { id: toastId });
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post: ' + (error.reason || error.message), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    if (!walletClient) {
      toast.error('Please connect your wallet');
      return;
    }
    
    let toastId;
    setLoading(true);
    toastId = toast.loading('Adding comment to blockchain... 🔐');
    
    try {
      const commentHash = ethers.utils.id(comment);
      
      // Prepare contract interaction
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      toast.loading('Sending blockchain transaction... ⛓️', { id: toastId });
      
      // Use post_id which IS the blockchain post ID
      console.log('💬 Commenting on post with blockchain ID:', post.post_id);
      const tx = await contract.commentOnPost(post.post_id, commentHash);
      
      toast.loading('Waiting for confirmation... ⏳', { id: toastId });
      const receipt = await tx.wait();

      // Get comment ID from event or use timestamp
      const commentId = Date.now();

      // Save to backend with transaction hash
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interactions/comment`, {
        commentId,
        postId: post.post_id,
        userAddress: address,
        commentHash,
        commentText: comment,
        transactionHash: receipt.transactionHash,
      });

      toast.success(`Comment added! 💬 TX: ${receipt.transactionHash.slice(0, 10)}...`, { id: toastId });
      setComment('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error commenting:', error);
      toast.error('Failed to add comment: ' + (error.reason || error.message), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    let toastId;
    try {
      setLoading(true);
      toastId = toast.loading('Sharing post on blockchain... 🔐');

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      toast.loading('Sending blockchain transaction... ⛓️', { id: toastId });
      
      // Use post_id which IS the blockchain post ID
      console.log('🔄 Sharing post with blockchain ID:', post.post_id);
      const tx = await contract.sharePost(post.post_id, 'Shared!');
      
      toast.loading('Waiting for confirmation... ⏳', { id: toastId });
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      
      // SIMPLE APPROACH: Just query postCounter after transaction
      toast.loading('Getting new post ID... 🔍', { id: toastId });
      
      const newPostId = (await contract.postCounter()).toNumber();
      
      console.log('🎉 Shared post created with blockchain ID:', newPostId);
      console.log('📋 Transaction hash:', receipt.transactionHash);

      // Save to backend
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts`, {
        postId: newPostId,
        authorAddress: address,
        contentHash: ethers.utils.id(`Shared: ${post.content_text}`),
        contentText: `🔄 Shared from @${post.username || post.author_address.slice(0, 6)}:\n\n${post.content_text}`,
        mediaUrls: post.media_urls || '',
        transactionHash: receipt.transactionHash,
      });

      toast.success(`Post shared! 📤 TX: ${receipt.transactionHash.slice(0, 10)}...`, { id: toastId });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share: ' + (error.reason || error.message), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleTip = async () => {
    if (!walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    // Check if trying to tip self
    if (address.toLowerCase() === post.author_address.toLowerCase()) {
      toast.error('Cannot tip your own post! 😅');
      return;
    }

    let toastId;
    try {
      setLoading(true);
      toastId = toast.loading('Sending tip on blockchain... 🔐');

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Tip amount: 0.001 ETH
      const tipAmount = ethers.utils.parseEther('0.001');
      
      toast.loading('Encrypting tip with FHE... 🔐', { id: toastId });
      
      // Dynamically import FHE library (client-side only, prevents SSR WASM issues)
      const { encryptUint64 } = await import('@/lib/fhe');
      
      // Proper FHE encryption using official Aura Relayer SDK
      const tipAmountWei = 1000000000000000; // 0.001 ETH in wei
      const { handle, inputProof } = await encryptUint64(
        tipAmountWei,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        address
      );

      toast.loading('Sending blockchain transaction... ⛓️', { id: toastId });
      
      console.log('💰 Tipping user:', post.author_address);
      
      // Call smart contract tipUser with properly encrypted FHE data
      const tx = await contract.tipUser(post.author_address, handle, inputProof, {
        value: tipAmount,
        gasLimit: 500000 // Manual gas limit for FHE operations
      });
      
      toast.loading('Waiting for confirmation... ⏳', { id: toastId });
      const receipt = await tx.wait();

      // Save to backend
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interactions/tip`, {
        fromAddress: address,
        toAddress: post.author_address,
        amount: '0.001',
        transactionHash: receipt.transactionHash,
      });

      toast.success(`Tip sent! 💰 0.001 ETH - TX: ${receipt.transactionHash.slice(0, 10)}...`, { id: toastId });
    } catch (error) {
      console.error('Error tipping:', error);
      toast.error('Failed to send tip: ' + (error.reason || error.message || 'Transaction failed'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-hover">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href={`/profile/${post.author_address}`} className="flex items-center space-x-3 group">
          {post.avatar_url ? (
            <img 
              src={post.avatar_url} 
              alt={post.username} 
              className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400 shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">
                {post.username?.[0]?.toUpperCase() || post.author_address.slice(2, 4).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-white group-hover:text-yellow-400 transition-colors">
              {post.username || `${post.author_address.slice(0, 6)}...${post.author_address.slice(-4)}`}
            </p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-300 whitespace-pre-wrap mb-3">{post.content_text}</p>
        
        {/* Post Image */}
        {post.media_urls && (
          <div className="mt-3 rounded-lg overflow-hidden border-2 border-yellow-400">
            <img 
              src={post.media_urls} 
              alt="Post content" 
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <button
          onClick={handleLike}
          disabled={loading}
          className="flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          title="Likes (FHE encrypted - count is private)"
        >
          {liked ? (
            <HeartSolidIcon className="w-6 h-6 text-red-500" />
          ) : (
            <HeartIcon className="w-6 h-6" />
          )}
          <span className="text-xs font-semibold">🔐 Likes</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors"
          title="Comments (FHE encrypted count)"
        >
          <ChatBubbleLeftIcon className="w-6 h-6" />
          <span className="text-xs font-semibold">🔐 Comments</span>
        </button>

        <button
          onClick={handleShare}
          disabled={loading}
          className="flex items-center space-x-2 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50"
          title="Shares (FHE encrypted count)"
        >
          <ShareIcon className="w-6 h-6" />
          <span className="text-xs font-semibold">🔐 Share</span>
        </button>

        <button
          onClick={handleTip}
          disabled={loading}
          className="flex items-center space-x-2 text-gray-400 hover:text-yellow-500 transition-colors disabled:opacity-50"
          title="Tip 0.001 ETH (FHE encrypted)"
        >
          <CurrencyDollarIcon className="w-6 h-6" />
          <span>Tip</span>
          <span className="text-xs">🔐</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (blockchain transaction) 💬"
              className="input text-sm"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={loading || !comment.trim()}
              className="btn-primary disabled:opacity-50 px-4 text-sm"
            >
              {loading ? '⏳' : 'Post'}
            </button>
          </div>
          <div className="text-sm text-gray-500">
            🔐 Comments are FHE encrypted - count is private to protect user privacy
          </div>
        </div>
      )}
    </div>
  );
}
