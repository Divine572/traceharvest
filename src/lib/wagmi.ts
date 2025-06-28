'use client';

import { createConfig } from 'wagmi';
import { sepolia } from 'viem/chains';
import { http } from 'viem';

export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
  },
});