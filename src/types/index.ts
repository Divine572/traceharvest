export type UserRole = 'harvester' | 'processor' | 'transporter' | 'inspector' | 'consumer';

export interface BatchData {
  id: string;
  batchNumber: string;
  species: string;
  quantity: number;
  location: string;
  harvestDate: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  currentStage: UserRole;
  harvesterId?: string;
  processorId?: string;
  transporterId?: string;
  inspectorId?: string;
  blockchainHash?: string;
  tokenId?: number;
}

export interface QRData {
  batchId: string;
  contractAddress: string;
  network: 'base-sepolia';
  tokenId: number;
  timestamp: number;
}

export interface TraceStep {
  role: UserRole;
  timestamp: string;
  location: string;
  status: string;
  details: Record<string, any>;
  blockchainHash: string;
  verified: boolean;
}