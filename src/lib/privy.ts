'use client';

import { baseSepolia } from 'viem/chains';


// This is mainly for reference now, since we're configuring directly in layout
export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID as string,
  chainId: baseSepolia.id,
};