'use client';

import { useState } from 'react';
import { Eye, QrCode, MapPin, Calendar, Package, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useUserBatches, type BatchData } from '@/hooks/useTraceability';

interface RecentBatchesProps {
  onCreateBatch?: () => void;
  onViewAll?: () => void;
}

export default function RecentBatches({ onCreateBatch, onViewAll }: RecentBatchesProps) {
    const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const { address } = useAccount();
    const { batches, totalSystemBatches, isLoading } = useUserBatches(address);

  const getStatusName = (status: number): string => {
      const statuses = ['Harvested', 'Processing', 'Processed', 'In Transit', 'Inspected', 'Delivered'];
      return statuses[status] || 'Unknown';
  };

    const getStatusColor = (status: number): string => {
        const colors = [
            'bg-blue-100 text-blue-800 border-blue-200',     // Harvested
            'bg-yellow-100 text-yellow-800 border-yellow-200', // Processing
            'bg-purple-100 text-purple-800 border-purple-200', // Processed
            'bg-orange-100 text-orange-800 border-orange-200', // In Transit
            'bg-green-100 text-green-800 border-green-200',    // Inspected
            'bg-emerald-100 text-emerald-800 border-emerald-200' // Delivered
        ];
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

    // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Batches</h3>
        </div>
        <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your batches...</p>
        </div>
      </div>
    );
  }

    // Empty state
    if (batches.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Batches</h3>
                </div>
                <div className="p-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Batches Yet</h4>
                    <p className="text-gray-600 mb-6">
                        {totalSystemBatches === 0
                            ? "No batches exist in the system yet. Create the first one!"
                            : "You haven't created any batches yet. Start your shellfish traceability journey."}
                    </p>
                    {onCreateBatch && (
                        <button
                            onClick={onCreateBatch}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create First Batch
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Main content with batches
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Batches 
            <span className="text-sm text-gray-500 ml-2">
                          ({batches.length} yours, {totalSystemBatches} total)
            </span>
          </h3>
                  {onViewAll && batches.length > 5 && (
                      <button
                          type="button"
                          onClick={onViewAll}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                          View All
                      </button>
                  )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
              {batches.map((batch, index) => (
          <div
                key={batch.id}
            className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => setSelectedBatch(selectedBatch === index ? null : index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">#{batch.batchNumber}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(batch.status)}`}>
                    {getStatusName(batch.status)}
                  </span>
                            <div className="flex items-center text-green-600" title="QR Code Available">
                                <QrCode className="h-4 w-4" />
                            </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>{batch.species}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                                <span className="font-medium">{batch.quantity} kg</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{batch.harvestLocation}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                                <span>{batch.harvestDate.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button 
                  type="button"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle view details
                                console.log('View details for batch:', batch.id);
                            }}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button 
                  type="button"
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download QR Code"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle QR code download
                                console.log('Download QR for batch:', batch.id);
                            }}
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
                                        <span className="font-medium">Batch ID:</span> {batch.id}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Harvester:</span>{' '}
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {batch.harvester.slice(0, 6)}...{batch.harvester.slice(-4)}
                        </code>
                      </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Status:</span> {getStatusName(batch.status)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h5 className="font-medium text-gray-900 mb-2">Harvest Details</h5>
                                <div className="space-y-1">
                                    <p className="text-gray-600">
                                        <span className="font-medium">Full Date:</span> {batch.harvestDate.toLocaleString()}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Location:</span> {batch.harvestLocation}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Verified:</span>
                                        <span className="text-green-600 ml-1">✓ On Blockchain</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    Click to view on blockchain explorer
                                </p>
                                <a
                                    href={`https://sepolia.etherscan.io/address/${process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span>View Contract</span>
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

          {/* Debug info (can remove in production) */}
      <div className="p-4 bg-gray-50 border-t text-xs text-gray-600">
              <p>
                  <strong>Debug:</strong> Your batches: {batches.length}, System total: {totalSystemBatches},
                  Loading: {isLoading ? 'Yes' : 'No'}
              </p>
              {address && (
                  <p><strong>Your address:</strong> {address}</p>
              )}
          </div>
    </div>
  );
}