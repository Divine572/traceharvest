'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { useCallback, useMemo } from 'react';

// Contract setup
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT as `0x${string}`;

const TRACEABILITY_ABI = [
  {
    "name": "createBatch",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "batchNumber", "type": "string" },
      { "name": "species", "type": "string" },
      { "name": "quantity", "type": "uint256" },
      { "name": "harvestLocation", "type": "string" },
      { "name": "details", "type": "string" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
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
  },
  {
    "name": "hasRole",
    "type": "function",
    "stateMutability": "view",
    "inputs": [
      { "name": "role", "type": "bytes32" },
      { "name": "account", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "name": "HARVESTER_ROLE",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32" }]
  },
  {
    "name": "getUserRole",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "string" }]
  }
] as const;

// Simple interfaces
export interface BatchData {
  id: number;
  batchNumber: string;
  harvester: string;
  species: string;
  quantity: number; // in kg
  harvestLocation: string;
  harvestDate: Date;
  status: number;
}

export interface UserStats {
  totalBatches: number;
  activeBatches: number;
  harvestLocations: number;
  qrCodesGenerated: number;
}

// 🎯 Hook 1: Get total batches count
export function useTotalBatches() {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRACEABILITY_ABI,
    functionName: 'getTotalBatches',
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const totalBatches = data ? Number(data) : 0;

  console.log('📊 Total batches in system:', totalBatches);

  return { totalBatches, isLoading: isPending, error };
}

// 🎯 Hook 2: Get single batch (error-safe)
export function useBatch(batchId: number) {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRACEABILITY_ABI,
    functionName: 'getBatch',
    args: [BigInt(batchId)],
    query: {
      enabled: !!CONTRACT_ADDRESS && batchId >= 0,
      retry: false, // Don't retry on error
    },
  });

  const batch = useMemo(() => {
    if (error) {
      // Log but don't spam - only show meaningful errors
      if (error.message.includes('does not exist')) {
        console.log(`❌ Batch ${batchId} does not exist (contract says so)`);
      } else {
        console.log(`❌ Batch ${batchId} error:`, error.message.split('.')[0]);
      }
      return null;
    }

    if (!data || !Array.isArray(data) || data.length < 9) {
      return null;
    }
    
    const [id, batchNumber, harvester, species, quantity, harvestLocation, harvestDate, status, exists] = data;
    
    if (!exists) {
      console.log(`❌ Batch ${batchId} exists flag is false`);
      return null;
    }

    const processedBatch = {
      id: Number(id),
      batchNumber,
      harvester,
      species,
      quantity: Number(quantity) / 1000, // Convert to kg
      harvestLocation,
      harvestDate: new Date(Number(harvestDate) * 1000),
      status: Number(status),
    } as BatchData;

    console.log(`✅ Batch ${batchId} found:`, processedBatch.batchNumber, processedBatch.species);
    return processedBatch;
  }, [data, error, batchId]);

  return { batch, isLoading: isPending, error };
}

// 🎯 Hook 3: Smart batch finder - auto-detects indexing pattern
export function useUserBatches(userAddress?: string) {
  const { totalBatches, isLoading: totalLoading } = useTotalBatches();

  console.log(`👤 Looking for batches for: ${userAddress}`);
  console.log(`📊 Total batches reported: ${totalBatches}`);

  // If no total batches, return early
  if (!totalLoading && totalBatches === 0) {
    return {
      batches: [],
      totalSystemBatches: 0,
      isLoading: false
    };
  }

  // 🧠 Smart Strategy: Test both 0-based and 1-based patterns
  // Since we know batch 0 fails, let's try 1-based first, then fill gaps with 0-based
  const smartTestIds = totalBatches > 0 ? [
    // Test 1-based pattern first (most likely based on evidence)
    totalBatches,       // Last batch (1-based)
    totalBatches - 1,   // Second to last
    totalBatches - 2,   // Third to last
    1,                  // First batch (1-based)
    2,                  // Second batch
    3,                  // Third batch
    // Test 0-based as backup
    totalBatches - 1,   // Last batch (0-based) - might be duplicate
    totalBatches - 2,   // Second to last (0-based)
    0,                  // First batch (0-based) - we know this fails
  ].filter((id, index, arr) => arr.indexOf(id) === index && id > 0) // Remove duplicates and invalid IDs
    .sort((a, b) => b - a) // Sort descending (newest first)
    .slice(0, 8) : []; // Limit to 8 tests

  console.log(`🧠 Smart testing batch IDs:`, smartTestIds);

  // Always call the same number of hooks for Rules of Hooks compliance
  const batch1 = useBatch(smartTestIds[0] || -1);
  const batch2 = useBatch(smartTestIds[1] || -1);
  const batch3 = useBatch(smartTestIds[2] || -1);
  const batch4 = useBatch(smartTestIds[3] || -1);
  const batch5 = useBatch(smartTestIds[4] || -1);
  const batch6 = useBatch(smartTestIds[5] || -1);
  const batch7 = useBatch(smartTestIds[6] || -1);
  const batch8 = useBatch(smartTestIds[7] || -1);

  // Collect valid batches
  const allFetchedBatches = [
    batch1.batch, batch2.batch, batch3.batch, batch4.batch,
    batch5.batch, batch6.batch, batch7.batch, batch8.batch
  ].filter((batch): batch is BatchData => batch !== null);

  console.log(`📦 Found ${allFetchedBatches.length} valid batches:`,
    allFetchedBatches.map(b => `#${b.id}:${b.batchNumber}`));

  // Auto-detect indexing pattern
  if (allFetchedBatches.length > 0) {
    const foundIds = allFetchedBatches.map(b => b.id).sort((a, b) => a - b);
    const minId = foundIds[0];
    const maxId = foundIds[foundIds.length - 1];

    if (minId === 1) {
      console.log(`🎯 Pattern detected: 1-based indexing (IDs start from 1)`);
    } else if (minId === 0) {
      console.log(`🎯 Pattern detected: 0-based indexing (IDs start from 0)`);
    } else {
      console.log(`🎯 Pattern detected: Custom indexing (IDs start from ${minId})`);
    }

    console.log(`📈 Found ID range: ${minId} to ${maxId}`);
  }

  // Filter by user address
  const userBatches = allFetchedBatches.filter(batch => {
    const isMatch = userAddress && batch.harvester.toLowerCase() === userAddress.toLowerCase();
    console.log(`🔍 Batch ${batch.id}: harvester=${batch.harvester.slice(0, 10)}..., user=${userAddress?.slice(0, 10)}..., match=${isMatch}`);
    return isMatch;
  });

  const isLoading = totalLoading || [
    batch1.isLoading, batch2.isLoading, batch3.isLoading, batch4.isLoading,
    batch5.isLoading, batch6.isLoading, batch7.isLoading, batch8.isLoading
  ].some(loading => loading);

  console.log(`👤 User batches found: ${userBatches.length}`);

  return {
    batches: userBatches, 
    totalSystemBatches: totalBatches,
    isLoading
  };
}

// 🎯 Hook 4: Calculate user stats
export function useUserStats(batches: BatchData[]): UserStats {
  return useMemo(() => {
    if (batches.length === 0) {
      return {
        totalBatches: 0,
        activeBatches: 0,
        harvestLocations: 0,
        qrCodesGenerated: 0,
      };
    }

    const uniqueLocations = new Set(batches.map(b => b.harvestLocation));
    
    return {
      totalBatches: batches.length,
      activeBatches: batches.filter(b => b.status < 5).length,
      harvestLocations: uniqueLocations.size,
      qrCodesGenerated: batches.length,
    };
  }, [batches]);
}

// 🎯 Hook 5: Create batch
export function useCreateBatch() {
  const { writeContract, isPending, data, error } = useWriteContract();

  const createBatch = useCallback(async (
    batchNumber: string,
    species: string,
    quantity: number, // kg
    harvestLocation: string,
    details: string
  ) => {
    console.log('🚀 Creating batch:', { batchNumber, species, quantity });

    return await writeContract({
      address: CONTRACT_ADDRESS,
      abi: TRACEABILITY_ABI,
      functionName: 'createBatch',
      args: [
        batchNumber,
        species,
        BigInt(Math.floor(quantity * 1000)), // Convert to grams
        harvestLocation,
        details
      ],
    });
  }, [writeContract]);

  return { createBatch, isCreating: isPending, data, error };
}

// 🎯 Hook 6: Check harvester role
export function useHarvesterRole(address?: string) {
  const { data: roleBytes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRACEABILITY_ABI,
    functionName: 'HARVESTER_ROLE',
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const { data: hasRole, isPending } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRACEABILITY_ABI,
    functionName: 'hasRole',
    args: roleBytes && address ? [roleBytes, address as `0x${string}`] : undefined,
    query: { enabled: !!roleBytes && !!address },
  });

  return { hasHarvesterRole: !!hasRole, isLoading: isPending };
}

// 🎯 Hook 7: Get user role
export function useUserRole(address?: string) {
  const { data: role, isPending } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRACEABILITY_ABI,
    functionName: 'getUserRole',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!CONTRACT_ADDRESS && !!address },
  });

  return {
    role: role === 'none' ? null : role,
    isLoading: isPending
  };
}