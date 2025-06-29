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

function BatchTest({ batchId }: { batchId: number }) {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_ABI,
    functionName: 'getBatch',
    args: [BigInt(batchId)],
    query: { 
      enabled: !!CONTRACT_ADDRESS && batchId >= 0,
      retry: false // Don't retry on error
    },
  });

  const exists = data && Array.isArray(data) && data[8] === true;

  return (
    <div className={`p-3 border rounded-lg ${exists ? 'bg-green-50 border-green-200' : error ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <h4 className="font-bold">Batch #{batchId}</h4>
      {isPending && <p className="text-sm text-gray-600">Loading...</p>}
      {error && <p className="text-sm text-red-600">❌ Error: {error.message.split('.')[0]}</p>}
      {data && !error && (
        <div className="text-sm space-y-1">
          {exists ? (
            <>
              <p className="text-green-700">✅ <strong>EXISTS!</strong></p>
              <p><strong>Batch Number:</strong> {data[1]}</p>
              <p><strong>Species:</strong> {data[3]}</p>
              <p><strong>Harvester:</strong> {data[2]?.slice(0, 10)}...</p>
              <p><strong>Quantity:</strong> {Number(data[4]) / 1000} kg</p>
            </>
          ) : (
            <p className="text-yellow-700">⚠️ Data returned but exists=false</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function BatchFinder() {
  const [searchRange, setSearchRange] = useState<'0-10' | '1-11' | '0-20' | 'custom'>('0-10');
  const [customStart, setCustomStart] = useState(0);
  const [customEnd, setCustomEnd] = useState(15);

  const { data: totalBatches } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_ABI,
    functionName: 'getTotalBatches',
  });

  const getBatchIds = () => {
    switch (searchRange) {
      case '0-10':
        return Array.from({ length: 11 }, (_, i) => i); // 0 to 10
      case '1-11':
        return Array.from({ length: 11 }, (_, i) => i + 1); // 1 to 11
      case '0-20':
        return Array.from({ length: 21 }, (_, i) => i); // 0 to 20
      case 'custom':
        return Array.from({ length: customEnd - customStart + 1 }, (_, i) => customStart + i);
      default:
        return [];
    }
  };

  const batchIds = getBatchIds();

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">🔍 Batch ID Finder</h2>
        <p className="text-blue-800">
          <strong>Total Batches:</strong> {totalBatches ? Number(totalBatches) : 'Loading...'}
        </p>
        <p className="text-blue-700 text-sm">
          This tool will test different batch IDs to find which ones actually exist.
        </p>
      </div>

      {/* Search Range Selector */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold mb-3">🎯 Search Range</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSearchRange('0-10')}
            className={`px-3 py-2 rounded-lg text-sm ${searchRange === '0-10' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Test 0-10 (0-based)
          </button>
          <button
            onClick={() => setSearchRange('1-11')}
            className={`px-3 py-2 rounded-lg text-sm ${searchRange === '1-11' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Test 1-11 (1-based)
          </button>
          <button
            onClick={() => setSearchRange('0-20')}
            className={`px-3 py-2 rounded-lg text-sm ${searchRange === '0-20' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Test 0-20 (Wide range)
          </button>
          <button
            onClick={() => setSearchRange('custom')}
            className={`px-3 py-2 rounded-lg text-sm ${searchRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Custom Range
          </button>
        </div>

        {searchRange === 'custom' && (
          <div className="flex gap-2 items-center">
            <label className="text-sm">From:</label>
            <input
              type="number"
              value={customStart}
              onChange={(e) => setCustomStart(Number(e.target.value))}
              className="border rounded px-2 py-1 w-20"
            />
            <label className="text-sm">To:</label>
            <input
              type="number"
              value={customEnd}
              onChange={(e) => setCustomEnd(Number(e.target.value))}
              className="border rounded px-2 py-1 w-20"
            />
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {batchIds.map(batchId => (
          <BatchTest key={batchId} batchId={batchId} />
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">📊 Summary</h3>
        <p><strong>Testing Range:</strong> {batchIds[0]} to {batchIds[batchIds.length - 1]}</p>
        <p><strong>Total IDs Testing:</strong> {batchIds.length}</p>
        <p className="text-sm text-gray-600 mt-2">
          ✅ Green = Batch exists | ❌ Red = Error/doesn't exist | ⚠️ Yellow = Data but exists=false
        </p>
      </div>
    </div>
  );
}