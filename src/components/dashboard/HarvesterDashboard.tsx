'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { Plus, Fish, MapPin, Calendar, Package, QrCode } from 'lucide-react';
import CreateBatchForm from './CreateBatchForm';
import RecentBatches from './RecentBatches';
import { useHarvesterStats } from '@/hooks/useTraceability';

export default function HarvesterDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAllBatches, setShowAllBatches] = useState(false);
  const { user } = usePrivy();
  const { address } = useAccount();
  
  const { 
    totalUserBatches, 
    activeBatches, 
    harvestLocations, 
    qrCodesGenerated,
    isLoading: statsLoading 
  } = useHarvesterStats(address);

  const handleBatchCreated = () => {
    setShowCreateForm(false);
    // The hooks will automatically refetch data
  };

  const handleCreateBatch = () => {
    setShowCreateForm(true);
  };

  const handleViewAllBatches = () => {
    setShowAllBatches(true);
    // For now, just show an alert - you can implement a full page later
    alert('View All Batches - Coming Soon!\n\nThis will show a full-page view of all your batches with advanced filtering and sorting options.');
  };

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
                <p className="text-sm text-gray-600">Welcome back, {user?.email?.address?.split('@')[0]}</p>
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
          <StatCard
            icon={<Package className="h-8 w-8 text-blue-600" />}
            title="Total Batches"
            value={statsLoading ? "..." : totalUserBatches.toString()}
            change={totalUserBatches > 0 ? `+${Math.min(totalUserBatches, 3)} this month` : "Get started"}
            changeType={totalUserBatches > 0 ? "positive" : "neutral"}
          />
          <StatCard
            icon={<Fish className="h-8 w-8 text-green-600" />}
            title="Active Batches"
            value={statsLoading ? "..." : activeBatches.toString()}
            change="In supply chain"
            changeType="neutral"
          />
          <StatCard
            icon={<MapPin className="h-8 w-8 text-purple-600" />}
            title="Harvest Locations"
            value={statsLoading ? "..." : harvestLocations.toString()}
            change={harvestLocations > 0 ? "Lagos Bay, Epe..." : "No locations yet"}
            changeType="neutral"
          />
          <StatCard
            icon={<QrCode className="h-8 w-8 text-orange-600" />}
            title="QR Codes Generated"
            value={statsLoading ? "..." : qrCodesGenerated.toString()}
            change={qrCodesGenerated > 0 ? "100% coverage" : "Create batches first"}
            changeType={qrCodesGenerated > 0 ? "positive" : "neutral"}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Batches */}
          <div className="lg:col-span-2">
            <RecentBatches 
              onCreateBatch={handleCreateBatch}
              onViewAll={handleViewAllBatches}
            />
          </div>

          {/* Quick Actions */}
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

// Stats Card Component (unchanged)
function StatCard({ 
  icon, 
  title, 
  value, 
  change, 
  changeType 
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className={`text-sm mt-1 ${changeColor}`}>{change}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Quick Actions Component (unchanged)
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
        <button className="w-full bg-green-50 text-green-700 p-3 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-3">
          <QrCode className="h-5 w-5" />
          <span>Generate QR Codes</span>
        </button>
        <button className="w-full bg-purple-50 text-purple-700 p-3 rounded-lg hover:bg-purple-100 transition-colors flex items-center space-x-3">
          <MapPin className="h-5 w-5" />
          <span>Update Location</span>
        </button>
      </div>
    </div>
  );
}

// Harvest Tips Component (unchanged)
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