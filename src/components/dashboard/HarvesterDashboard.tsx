'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { Plus, Fish, MapPin, Package, QrCode } from 'lucide-react';
import { useUserBatches, useUserStats } from '@/hooks/useTraceability';
import CreateBatchForm from './CreateBatchForm';
import RecentBatches from './RecentBatches';

export default function HarvesterDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = usePrivy();
  const { address } = useAccount();
  
  // Get user's batches and calculate stats
  const { batches, totalSystemBatches, isLoading } = useUserBatches(address);
  const stats = useUserStats(batches);

  const handleCreateBatch = () => setShowCreateForm(true);
  const handleBatchCreated = () => setShowCreateForm(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Fish className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Harvester Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.email?.address?.split('@')[0] || 'Harvester'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateBatch}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<Package className="h-8 w-8 text-blue-600" />}
            title="Total Batches"
            value={isLoading ? "..." : stats.totalBatches.toString()}
            subtitle={stats.totalBatches > 0 ? "Your batches" : "Get started"}
            color="blue"
          />
          <StatsCard
            icon={<Fish className="h-8 w-8 text-green-600" />}
            title="Active Batches"
            value={isLoading ? "..." : stats.activeBatches.toString()}
            subtitle={stats.activeBatches > 0 ? "In supply chain" : "No active batches"}
            color="green"
          />
          <StatsCard
            icon={<MapPin className="h-8 w-8 text-purple-600" />}
            title="Harvest Locations"
            value={isLoading ? "..." : stats.harvestLocations.toString()}
            subtitle={stats.harvestLocations > 0 ? "Unique locations" : "No locations yet"}
            color="purple"
          />
          <StatsCard
            icon={<QrCode className="h-8 w-8 text-orange-600" />}
            title="QR Codes"
            value={isLoading ? "..." : stats.qrCodesGenerated.toString()}
            subtitle={stats.qrCodesGenerated > 0 ? "Generated" : "Create batches first"}
            color="orange"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Batches */}
          <div className="lg:col-span-2">
            <RecentBatches onCreateBatch={handleCreateBatch} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActions onCreateBatch={handleCreateBatch} />
            <HarvestTips />
          </div>
        </div>
      </div>

      {/* Create Batch Modal */}
      {showCreateForm && (
        <CreateBatchForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleBatchCreated}
        />
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({ 
  icon, 
  title, 
  value, 
  subtitle,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
    subtitle: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const subtitleColor = value === "0" || value === "..."
    ? 'text-gray-500'
    : `text-${color}-600`;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className={`text-sm mt-1 ${subtitleColor}`}>{subtitle}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions({ onCreateBatch }: { onCreateBatch: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button
          onClick={onCreateBatch}
          className="w-full bg-blue-50 text-blue-700 p-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-3"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Batch</span>
        </button>
        <button
          className="w-full bg-green-50 text-green-700 p-3 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-3"
          onClick={() => alert('QR Code generation coming soon!')}
        >
          <QrCode className="h-5 w-5" />
          <span>Generate QR Codes</span>
        </button>
        <button
          className="w-full bg-purple-50 text-purple-700 p-3 rounded-lg hover:bg-purple-100 transition-colors flex items-center space-x-3"
          onClick={() => alert('Location update coming soon!')}
        >
          <MapPin className="h-5 w-5" />
          <span>Update Location</span>
        </button>
      </div>
    </div>
  );
}

// Harvest Tips Component
function HarvestTips() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Harvest Tips</h3>
      <div className="space-y-3 text-sm text-blue-800">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <p>Record harvest immediately for best traceability</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <p>Include precise GPS coordinates when possible</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <p>Take photos of harvest conditions</p>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <p>Check water temperature and quality</p>
        </div>
      </div>
    </div>
  );
}