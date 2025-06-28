'use client';

import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useUserRole, useGetBatch } from '@/hooks/useTraceability';
import { useEffect, useState } from 'react';

export default function ContractTest() {
  const [mounted, setMounted] = useState(false);
  const { user, authenticated, ready, connectWallet } = usePrivy();
  const { address, isConnected } = useAccount();
  const { role, isPending: roleLoading } = useUserRole(address);
  const { batch, isPending: batchLoading } = useGetBatch(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  if (!ready) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-lg mb-2">🔄 Loading...</h3>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-300">
          <h3 className="font-bold text-lg mb-2 text-yellow-800">🔐 Please Sign In</h3>
          <p className="text-yellow-700">Authentication required to continue</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-300">
          <h3 className="font-bold text-lg mb-2 text-orange-800">⏳ Setting Up Wallet</h3>
          <p className="text-orange-700 mb-4">
            Signed in as: <strong>{user?.email?.address || user?.google?.email}</strong>
          </p>
          
          <div className="mb-4 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            <span className="text-orange-600">Creating blockchain wallet...</span>
          </div>

          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            🔗 Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-300">
          <h3 className="font-bold text-lg mb-2 text-green-800">✅ Wallet Connected!</h3>
          
          <div className="space-y-2 text-sm">
            <p><strong>User:</strong> {user?.email?.address || user?.google?.email}</p>
            <p><strong>Wallet:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{address}</code></p>
            <p><strong>Role:</strong> {roleLoading ? 'Loading...' : role || 'No role assigned'}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">📦 Contract Test</h3>
          <p><strong>Batch #1:</strong> {batchLoading ? 'Loading...' : batch ? 'Found!' : 'No batch found (expected)'}</p>
        </div>

        <div className="p-4 bg-blue-100 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-blue-800">🎉 System Ready!</h3>
          <div className="text-blue-700 space-y-1">
            <p>✅ Authentication working</p>
            <p>✅ Wallet connected</p>
            <p>✅ Smart contracts deployed</p>
            <p>✅ Ready to build TraceHarvest!</p>
          </div>
        </div>
      </div>
    </div>
  );
}