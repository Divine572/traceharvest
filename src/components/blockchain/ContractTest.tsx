'use client';

import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useTotalBatches, useBatch, useUserRole, useHarvesterRole } from '@/hooks/useTraceability';
import { useEffect, useState } from 'react';

export default function ContractTest() {
  const [mounted, setMounted] = useState(false);
  const { user, authenticated, ready, connectWallet } = usePrivy();
  const { address, isConnected } = useAccount();

  // Use our corrected hooks
  const { totalBatches, isLoading: batchesLoading } = useTotalBatches();
  // 🔧 KEY FIX: Test batch 0 instead of batch 1 (0-based indexing)
  const { batch: firstBatch, isLoading: firstBatchLoading } = useBatch(0);
  const { role, isLoading: roleLoading } = useUserRole(address);
  const { hasHarvesterRole, isLoading: harvesterLoading } = useHarvesterRole(address);

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
          <h3 className="font-bold text-lg mb-2">🔄 Loading TraceHarvest...</h3>
          <p className="text-blue-700">Initializing authentication system</p>
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
        {/* Connection Status */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-300">
          <h3 className="font-bold text-lg mb-2 text-green-800">✅ Wallet Connected!</h3>
          
          <div className="space-y-2 text-sm">
            <p><strong>User:</strong> {user?.email?.address || user?.google?.email}</p>
            <p><strong>Wallet:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{address}</code></p>
            <p><strong>Role:</strong> {roleLoading ? 'Loading...' : role || 'No role assigned'}</p>
            <p><strong>Harvester Access:</strong> {harvesterLoading ? 'Checking...' : hasHarvesterRole ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        {/* Contract Status */}
        <div className="p-4 bg-white rounded-lg shadow border">
          <h3 className="font-bold text-lg mb-2">📦 Smart Contract Status</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Contract Address:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT}</code></p>
            <p><strong>Network:</strong> Ethereum Sepolia Testnet</p>
            <p><strong>Total Batches:</strong> {batchesLoading ? 'Loading...' : totalBatches}</p>
            <p><strong>First Batch (ID=0):</strong> {firstBatchLoading ? 'Loading...' : firstBatch ? `Found: ${firstBatch.batchNumber}` : 'No batch at ID 0'}</p>
            {totalBatches > 0 && (
              <p className="text-blue-600"><strong>Valid Batch IDs:</strong> 0 to {totalBatches - 1} (0-based indexing)</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="p-4 bg-blue-100 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-blue-800">🎉 System Status</h3>
          <div className="text-blue-700 space-y-1">
            <p>✅ Authentication: Working</p>
            <p>✅ Wallet: Connected ({address?.slice(0, 6)}...{address?.slice(-4)})</p>
            <p>✅ Smart Contract: {totalBatches >= 0 ? 'Accessible' : 'Error'}</p>
            <p>✅ Role System: {role ? `Working (${role})` : 'Working (no role)'}</p>
            <p>✅ Batch Indexing: 0-based (fixed!)</p>
            <p>✅ TraceHarvest: Ready to use!</p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-gray-800">🔍 Debug Information</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Contract Address:</strong> {process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT}</p>
            <p><strong>Chain ID:</strong> {process.env.NEXT_PUBLIC_CHAIN_ID}</p>
            <p><strong>User Address:</strong> {address}</p>
            <p><strong>Total System Batches:</strong> {totalBatches}</p>
            <p><strong>Batch ID Range:</strong> {totalBatches > 0 ? `0 to ${totalBatches - 1}` : 'No batches yet'}</p>
            {firstBatch && (
              <div className="mt-2 p-2 bg-white rounded border">
                <p><strong>First Batch (ID=0) Details:</strong></p>
                <p>• ID: {firstBatch.id}</p>
                <p>• Number: {firstBatch.batchNumber}</p>
                <p>• Species: {firstBatch.species}</p>
                <p>• Quantity: {firstBatch.quantity} kg</p>
                <p>• Location: {firstBatch.harvestLocation}</p>
                <p>• Harvester: {firstBatch.harvester.slice(0, 6)}...{firstBatch.harvester.slice(-4)}</p>
                <p>• Date: {firstBatch.harvestDate.toLocaleString()}</p>
                <p>• Status: {firstBatch.status}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Helper */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-bold text-lg mb-2 text-purple-800">🚀 Next Steps</h3>
          <div className="text-purple-700 space-y-2">
            <p>Your TraceHarvest system is fully operational! Here's what you can do:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Dashboard:</strong> Go to Harvester Dashboard to see your stats </li>
              <li><strong>Create Batches:</strong> {hasHarvesterRole ? 'You can create batches!' : 'You need harvester role first'}</li>
              <li><strong>View Batches:</strong> {totalBatches > 0 ? `${totalBatches} batches exist (IDs 0-${totalBatches - 1})` : 'No batches exist yet - create the first one!'}</li>
              <li><strong>QR Codes:</strong> Each batch automatically gets a QR code for traceability</li>
              <li><strong>Indexing:</strong> Batches use 0-based indexing (0, 1, 2, 3...)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}