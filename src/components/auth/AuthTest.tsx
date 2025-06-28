'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function AuthTest() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">
        🦪 TraceHarvest
      </h1>
      
      {!authenticated ? (
        <div className="text-center">
          <p className="mb-4 text-gray-600">
            Welcome to TraceHarvest! Please sign in to continue.
          </p>
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-2 text-green-600 font-semibold">✅ Authenticated!</p>
          <p className="mb-4 text-gray-600">
            Welcome, {user?.email?.address || 'User'}!
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-4">
            <p>User ID: {user?.id}</p>
            {user?.wallet?.address && (
              <p>Wallet: {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}</p>
            )}
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}