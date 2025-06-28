'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { Fish, Factory, Truck, Search, User, Settings } from 'lucide-react';
import AuthTest from '@/components/auth/AuthTest';
import ContractTest from '@/components/blockchain/ContractTest';
import HarvesterDashboard from '@/components/dashboard/HarvesterDashboard';
import ClientOnly from '@/components/ClientOnly';

type DashboardView = 'overview' | 'harvester' | 'processor' | 'transporter' | 'inspector' | 'consumer';

export default function Home() {
  const { authenticated, ready, user } = usePrivy();
  const { isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');

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

                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            {user?.email?.address}
                          </span>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                            <Settings className="h-5 w-5" />
                          </button>
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