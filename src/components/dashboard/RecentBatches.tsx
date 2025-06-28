'use client';

import { useState, useEffect } from 'react';
import { Eye, QrCode, MapPin, Calendar, Package, ExternalLink, Loader2 } from 'lucide-react';
import { useGetAllBatches, type BatchData } from '@/hooks/useTraceability';
import { useAccount } from 'wagmi';

interface RecentBatchesProps {
  onCreateBatch?: () => void;
  onViewAll?: () => void;
}

export default function RecentBatches({ onCreateBatch, onViewAll }: RecentBatchesProps) {
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const { batches, isLoading } = useGetAllBatches();
  const { address } = useAccount();

  // Debug logging
  useEffect(() => {
    console.log('🔍 RecentBatches Debug Info:');
    console.log('- Total batches from hook:', batches.length);
    console.log('- Batches data:', batches);
    console.log('- Current user address:', address);
    console.log('- Is loading:', isLoading);
    
    if (batches.length > 0) {
      console.log('- First batch harvester:', batches[0].harvester);
      console.log('- Address match:', batches[0].harvester.toLowerCase() === address?.toLowerCase());
    }
  }, [batches, address, isLoading]);

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 0: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-purple-100 text-purple-800 border-purple-200';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 4: return 'bg-green-100 text-green-800 border-green-200';
      case 5: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusName = (status: number): string => {
    switch (status) {
      case 0: return 'Harvested';
      case 1: return 'Processing';
      case 2: return 'Processed';
      case 3: return 'In Transit';
      case 4: return 'Inspected';
      case 5: return 'Delivered';
      default: return 'Unknown';
    }
  };

  const formatDate = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatQuantity = (quantity: bigint): string => {
    return (Number(quantity) / 1000).toFixed(1);
  };

  // Filter batches - let's debug this too
  const userBatches = batches.filter((batch: BatchData) => {
    const isUserBatch = batch.harvester.toLowerCase() === address?.toLowerCase();
    console.log(`Batch ${batch.batchNumber}: harvester=${batch.harvester}, user=${address}, match=${isUserBatch}`);
    return isUserBatch;
  }).slice(-5);

  console.log('📊 Filtered user batches:', userBatches.length);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Batches</h3>
        </div>
        <div className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Batches 
            <span className="text-sm text-gray-500 ml-2">
              ({batches.length} total, {userBatches.length} yours)
            </span>
          </h3>
          <button 
            type="button"
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            View All
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {userBatches.map((batch: BatchData, index) => (
          <div
            key={Number(batch.id)}
            className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => setSelectedBatch(selectedBatch === index ? null : index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    #{batch.batchNumber}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(batch.status)}`}>
                    {getStatusName(batch.status)}
                  </span>
                  <QrCode className="h-4 w-4 text-green-600">
                    <title>QR Code Available</title>
                  </QrCode>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>{batch.species}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{formatQuantity(batch.quantity)} kg</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{batch.harvestLocation}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(batch.harvestDate)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button 
                  type="button"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button 
                  type="button"
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </button>
              </div>
            </div>

            {selectedBatch === index && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Blockchain Details</h5>
                    <div className="space-y-1">
                      <p className="text-gray-600">
                        <span className="font-medium">Batch ID:</span> {Number(batch.id)}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Harvester:</span>{' '}
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {batch.harvester.slice(0, 6)}...{batch.harvester.slice(-4)}
                        </code>
                      </p>
                      
                      <a
                        href={`https://sepolia.etherscan.io/address/${process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <span>View Contract</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Actions</h5>
                    <div className="space-y-2">
                      <button 
                        type="button"
                        className="w-full bg-blue-50 text-blue-700 py-2 px-3 rounded hover:bg-blue-100 transition-colors text-sm"
                      >
                        View Full Timeline
                      </button>
                      <button 
                        type="button"
                        className="w-full bg-green-50 text-green-700 py-2 px-3 rounded hover:bg-green-100 transition-colors text-sm"
                      >
                        Generate QR Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Debug info panel */}
      <div className="p-4 bg-gray-50 border-t text-xs text-gray-600">
        <p><strong>Debug:</strong> Total: {batches.length}, Yours: {userBatches.length}, Loading: {isLoading ? 'Yes' : 'No'}</p>
        {batches.length > 0 && (
          <p><strong>First batch harvester:</strong> {batches[0]?.harvester}</p>
        )}
        <p><strong>Your address:</strong> {address}</p>
      </div>

      {userBatches.length === 0 && !isLoading && (
        <div className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No batches yet</h4>
          <p className="text-gray-600 mb-4">
            {batches.length > 0 
              ? "No batches found for your address. Check console for debug info."
              : "Create your first shellfish batch to get started"
            }
          </p>
          <button 
            type="button"
            onClick={onCreateBatch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Batch
          </button>
        </div>
      )}
    </div>
  );
}