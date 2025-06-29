'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { Fish, Factory, Truck, Search, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import AuthTest from '@/components/auth/AuthTest';
import ContractTest from '@/components/blockchain/ContractTest';
import HarvesterDashboard from '@/components/dashboard/HarvesterDashboard';
import ClientOnly from '@/components/ClientOnly';

type DashboardView = 'overview' | 'harvester' | 'processor' | 'transporter' | 'inspector' | 'consumer';

export default function Home() {
  const { authenticated, ready, user, logout } = usePrivy();
  const { isConnected, address } = useAccount();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  const renderDashboard = () => {
    switch (currentView) {
      case 'harvester':
        return <HarvesterDashboard />;
      case 'processor':
        return <div className="p-8 text-center"><h2 className="text-2xl">🏭 Processor Dashboard (Coming Soon)</h2></div>;
      case 'transporter':
        return <div className="p-8 text-center"><h2 className="text-2xl">🚚 Transporter Dashboard (Coming Soon)</h2></div>;
      case 'inspector':
        return <div className="p-8 text-center"><h2 className="text-2xl">🔍 Inspector Dashboard (Coming Soon)</h2></div>;
      case 'consumer':
        return <div className="p-8 text-center"><h2 className="text-2xl">👤 Consumer Interface (Coming Soon)</h2></div>;
      default:
        return <ContractTest />;
    }
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-100">
        {!ready ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-xl">Loading TraceHarvest...</div>
          </div>
        ) : !authenticated ? (
          <AuthTest />
        ) : !isConnected ? (
          <div>
            <div className="text-center py-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">
                🦪 TraceHarvest
              </h1>
              <p className="text-lg text-gray-600">Blockchain Shellfish Traceability System</p>
            </div>
            <ContractTest />
          </div>
        ) : (
          <div className="min-h-screen">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Fish className="h-6 w-6 text-blue-600" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900">TraceHarvest</h1>
                    </div>
                  </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600 hidden sm:block">
                            {user?.email?.address}
                          </span>

                          {/* User Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                              className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <Settings className="h-5 w-5" />
                              <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                              <>
                                {/* Backdrop */}
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setIsUserMenuOpen(false)}
                                />

                                {/* Menu */}
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
                                  {/* User Info */}
                                  <div className="px-4 py-3 border-b border-gray-100">
                                    <div className="flex items-center space-x-3">
                                      <div className="bg-blue-100 p-2 rounded-full">
                                        <User className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {user?.email?.address || 'User'}
                                        </p>
                                        {address && (
                                          <p className="text-xs text-gray-500 font-mono">
                                            {address.slice(0, 6)}...{address.slice(-4)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Menu Items */}
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setIsUserMenuOpen(false);
                                        // Add settings functionality here if needed
                                      }}
                                      className="flex items-center space-x-3 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Settings className="h-4 w-4" />
                                      <span className="text-sm">Settings</span>
                                    </button>

                                    <div className="border-t border-gray-100 my-1" />

                                    <button
                                      onClick={handleSignOut}
                                      className="flex items-center space-x-3 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <LogOut className="h-4 w-4" />
                                      <span className="text-sm">Sign Out</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Navigation Tabs */}
                      <div className="flex space-x-8 border-t pt-4">
                        <NavButton
                          icon={<Fish className="h-5 w-5" />}
                          label="System Overview"
                          active={currentView === 'overview'}
                          onClick={() => setCurrentView('overview')}
                        />
                        <NavButton
                          icon={<Fish className="h-5 w-5" />}
                          label="🎣 Harvester"
                          active={currentView === 'harvester'}
                          onClick={() => setCurrentView('harvester')}
                        />
                        <NavButton
                          icon={<Factory className="h-5 w-5" />}
                          label="🏭 Processor"
                          active={currentView === 'processor'}
                          onClick={() => setCurrentView('processor')}
                        />
                        <NavButton
                          icon={<Truck className="h-5 w-5" />}
                          label="🚚 Transporter"
                          active={currentView === 'transporter'}
                          onClick={() => setCurrentView('transporter')}
                        />
                        <NavButton
                          icon={<Search className="h-5 w-5" />}
                          label="🔍 Inspector"
                          active={currentView === 'inspector'}
                          onClick={() => setCurrentView('inspector')}
                        />
                        <NavButton
                          icon={<User className="h-5 w-5" />}
                          label="👤 Consumer"
                          active={currentView === 'consumer'}
                          onClick={() => setCurrentView('consumer')}
                        />
                      </div>
              </div>
            </nav>

            {/* Dashboard Content */}
            {renderDashboard()}
          </div>
        )}
      </div>
    </ClientOnly>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
          ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}