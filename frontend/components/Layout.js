import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>Aura Social DApp - Private Social Network</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen">
        {mounted && <Navbar />}
        <main>{children}</main>
        <footer className="bg-gray-900 border-t border-gray-800 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-400 text-sm">
                  Created with ❤️ by <span className="text-aura-primary font-semibold">Auranode</span>
                </p>
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-aura-primary transition-colors">
                  Powered by Aura FHE
                </a>
                <a href="#" className="text-gray-400 hover:text-aura-primary transition-colors">
                  Sepolia Testnet
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
