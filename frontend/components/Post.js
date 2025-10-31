/**
 * Post Component Wrapper
 * 
 * Uses next/dynamic to load the real Post component ONLY on client-side
 * This prevents WASM loading issues during SSR
 */

import dynamic from 'next/dynamic';

// Load PostClient component with NO SSR
// This ensures fhevmjs WASM only loads on client-side
const PostClient = dynamic(() => import('./PostClient'), {
  ssr: false,  // ⚠️ CRITICAL: Skip server-side rendering
  loading: () => (
    // Show loading skeleton while component loads
    <div className="card animate-pulse">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div className="h-8 bg-gray-700 rounded w-20"></div>
          <div className="h-8 bg-gray-700 rounded w-20"></div>
          <div className="h-8 bg-gray-700 rounded w-20"></div>
          <div className="h-8 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  ),
});

// Export as default to maintain compatibility
export default PostClient;
