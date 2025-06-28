'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { useCallback, useMemo } from 'react';

// Contract ABI
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
  }
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT as `0x${string}`;

// Simple batch interface
export interface BatchData {
  id: number;
  batchNumber: string;
  harvester: string;
  species: string;
  quantity: number; // in kg
  harvestLocation: string;
  harvestDate: Date;
  status: number;
  exists: boolean;
}

// Create batch hook
export function useCreateBatch() {
  const { writeContract, isPending, data, error } = useWriteContract();

  const createBatch = useCallback(async (
    batchNumber: string,
    species: string,
    quantity: number, // kg
    harvestLocation: string,
    details: string
  ) => {
    console.log('🚀 Creating batch:', { batchNumber, species, quantity, harvestLocation, details });
    
    const result = await writeContract({
      address: CONTRACT_ADDRESS,
      abi: TRACEABILITY_ABI,
      functionName: 'createBatch',
      args: [
        batchNumber,
        species,
        BigInt(Math.floor(quantity * 1000)), // Convert kg to grams
        harvestLocation,
        details
      ],
    });
    
    return result;
  }, [writeContract]);

  return { createBatch, isPending, data, error };
}

// Get total batches
export function useGetTotalBatches() {
  const { data, error, isPending } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRACEABILITY_ABI,
    functionName: 'getTotalBatches',
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  console.log('📊 Total batches:', data ? Number(data) : 0);

  return {
    totalBatches: data ? Number(data) : 0,
    isPending,
    error,
  };
}

// Get single batch
export function useGetBatch(batchId: number) {
  const { data, error, isPending } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TRACEABILITY_ABI,
    functionName: 'getBatch',
    args: [BigInt(batchId)],
    query: { enabled: !!CONTRACT_ADDRESS && batchId > 0 },
  });

  const batch = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length < 9) return null;
    
    const [id, batchNumber, harvester, species, quantity, harvestLocation, harvestDate, status, exists] = data;
    
    if (!exists) return null;

    return {
      id: Number(id),
      batchNumber,
      harvester,
      species,
      quantity: Number(quantity) / 1000, // Convert grams to kg
      harvestLocation,
      harvestDate: new Date(Number(harvestDate) * 1000),
      status: Number(status),
      exists,
    } as BatchData;
  }, [data]);

  return { batch, isPending, error };
}

// Check user role
export function useHasHarvesterRole(address?: string) {
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

  console.log('🔑 Has harvester role:', hasRole);

  return { hasRole: !!hasRole, isPending };
}

// Get all batches for a user
export function useGetUserBatches(userAddress?: string) {
  const { totalBatches, isPending: totalLoading } = useGetTotalBatches();
  
  // Get batches 1 through totalBatches
  const batch1 = useGetBatch(1);
  const batch2 = useGetBatch(2);
  const batch3 = useGetBatch(3);
  const batch4 = useGetBatch(4);
  const batch5 = useGetBatch(5);

  const allBatches = [batch1.batch, batch2.batch, batch3.batch, batch4.batch, batch5.batch]
    .filter((batch): batch is BatchData => batch !== null);

  const userBatches = allBatches.filter(batch => 
    userAddress && batch.harvester.toLowerCase() === userAddress.toLowerCase()
  );

  const isLoading = totalLoading || batch1.isPending || batch2.isPending || batch3.isPending || batch4.isPending || batch5.isPending;

  console.log('👤 User batches:', userBatches.length, 'out of', totalBatches, 'total');

  return {
    batches: userBatches,
    totalBatches,
    isLoading,
  };
}

// Stats hook
export function useHarvesterStats(userAddress?: string) {
  const { batches, totalBatches, isLoading } = useGetUserBatches(userAddress);

  const stats = useMemo(() => {
    const uniqueLocations = new Set(batches.map(b => b.harvestLocation));
    
    return {
      totalUserBatches: batches.length,
      activeBatches: batches.filter(b => b.status < 5).length,
      harvestLocations: uniqueLocations.size,
      qrCodesGenerated: batches.length,
    };
  }, [batches]);

  return { ...stats, isLoading };
}