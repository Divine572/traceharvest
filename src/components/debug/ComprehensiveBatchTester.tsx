'use client';

import { useReadContract } from 'wagmi';
import { useState } from 'react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT as `0x${string}`;

const SIMPLE_ABI = [
  {
    "name": "getBatch",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "batchId", "type": "uint256" }],
    "outputs": [
      { "name": "id", "type": "uint256" },
      { "name": "batchNumber", "type": "string" },
      { "name": "harvester", "type": "address" },
      { "name": "species", "type": "string" },
      { "name": "quantity", "type": "uint256" },
      { "name": "harvestLocation", "type": "string" },
      { "name": "harvestDate", "type": "uint256" },
      { "name": "status", "type": "uint8" },
      { "name": "exists", "type": "bool" }
    ]
  },
  {
    "name": "getTotalBatches",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }]
  }
] as const;

function QuickBatchTest({ batchId }: { batchId: number }) {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_ABI,
    functionName: 'getBatch',
    args: [BigInt(batchId)],
    query: { 
      enabled: !!CONTRACT_ADDRESS && batchId >= 0,
      retry: false
    },
  });

  const exists = data && Array.isArray(data) && data[8] === true;
  const hasData = data && Array.isArray(data);

  return (
    <div className={`p-2 border rounded text-sm ${
      exists ? 'bg-green-50 border-green-300' : 
      error ? 'bg-red-50 border-red-300' : 
      'bg-yellow-50 border-yellow-300'
    }`}>
      <div className="font-bold">ID: {batchId}</div>
      {isPending && <div className="text-gray-600">⏳</div>}
      {error && <div className="text-red-600">❌ {error.message.includes('does not exist') ? 'Not found' : 'Error'}</div>}
      {hasData && exists && (
        <div className="text-green-700">
          <div>✅ <strong>{data[1]}</strong></div>
          <div>{data[3]} ({Number(data[4])/1000}kg)</div>
          <div>By: {data[2]?.slice(0, 8)}...</div>
        </div>
      )}
      {hasData && !exists && (
        <div className="text-yellow-700">⚠️ Data but exists=false</div>
      )}
    </div>
  );
}

export default function ComprehensiveBatchTester() {
  const [showRange, setShowRange] = useState<'quick' | 'wide' | 'targeted'>('quick');
  
  const { data: totalBatches } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_ABI,
    functionName: 'getTotalBatches',
  });

  const total = totalBatches ? Number(totalBatches) : 0;

  const getTestIds = () => {
    switch (showRange) {
      case 'quick':
        // Test around the expected range based on total
        return [0, 1, 2, 3, total-2, total-1, total, total+1];
      case 'wide':
        // Test 0-20 to catch any pattern
        return Array.from({ length: 21 }, (_, i) => i);
      case 'targeted':
        // Test 1-based theory: 1 to total
        return Array.from({ length: total }, (_, i) => i + 1);
      default:
        return [];
    }
  };

  const testIds = getTestIds().filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">🔍 Comprehensive Batch Tester</h2>
        <div className="text-blue-800 space-y-1">
          <p><strong>Total Batches Reported:</strong> {total}</p>
          <p><strong>Contract Address:</strong> {CONTRACT_ADDRESS}</p>
          <p><strong>Goal:</strong> Find which batch IDs actually exist</p>
        </div>
      </div>

      {/* Test Strategy Selector */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold mb-3">🎯 Test Strategy</h3>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowRange('quick')}
            className={`px-3 py-2 rounded text-sm ${showRange === 'quick' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Quick Test (Smart Range)
          </button>
          <button
            onClick={() => setShowRange('targeted')}
            className={`px-3 py-2 rounded text-sm ${showRange === 'targeted' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            1-Based Theory (1 to {total})
          </button>
          <button
            onClick={() => setShowRange('wide')}
            className={`px-3 py-2 rounded text-sm ${showRange === 'wide' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Wide Range (0-20)
          </button>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Current Strategy:</strong> {
            showRange === 'quick' ? `Testing key IDs around expected range` :
            showRange === 'targeted' ? `Testing 1-based indexing (1 to ${total})` :
            'Testing 0-20 to find any pattern'
          }
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {testIds.map(batchId => (
          <QuickBatchTest key={batchId} batchId={batchId} />
        ))}
      </div>

      {/* Analysis */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">📊 Analysis</h3>
        <div className="text-sm space-y-1">
          <p><strong>Total Batches:</strong> {total}</p>
          <p><strong>Testing IDs:</strong> {testIds.join(', ')}</p>
          <p><strong>Legend:</strong></p>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              ✅ Exists & Valid
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 rounded"></div>
              ❌ Error/Not Found
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 rounded"></div>
              ⚠️ Has Data, exists=false
            </span>
          </div>
        </div>
      </div>

      {/* Expected Patterns */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="font-bold text-purple-800 mb-2">🧠 Expected Patterns</h3>
        <div className="text-sm text-purple-700 space-y-1">
          <p><strong>If 1-based:</strong> IDs 1, 2, 3, ..., {total} should exist</p>
          <p><strong>If 0-based:</strong> IDs 0, 1, 2, ..., {total-1} should exist</p>
          <p><strong>If custom:</strong> Some other pattern will emerge</p>
          <p><strong>Current evidence:</strong> Batch 0 = "does not exist", Total = {total}</p>
        </div>
      </div>
    </div>
  );
}