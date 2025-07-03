// Token address mapping
export const TOKEN_LIST = {
  43113: [
    { address: '0x5425890298aed601595a70AB815c96711a31Bc65', symbol: 'USDC', decimals: 6 },
  ],
  11155111: [
    { address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', symbol: 'USDC', decimals: 6 },
  ],
  42161: [
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
  ],
  8453: [
    { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC', decimals: 6 },
  ],
  137: [
    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', decimals: 6 }
  ],
};

// Kompatibilitas lama
export const TOKEN_ADDRESS = {
  43113: '0x5425890298aed601595a70AB815c96711a31Bc65',
  11155111: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
  42161:  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC Arbitrum native terbaru
  8453:   '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  137:    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC Polygon (versi baru)
};

// Updated metadata untuk chains
export const SUPPORTED_CHAINS = [
  { chainId: 43113, name: 'Avalanche Fuji (Testnet)', symbol: 'AVAX' },
  { chainId: 11155111, name: 'Ethereum Sepolia (Testnet)', symbol: 'ETH' },
  { chainId: 42161, name: 'Arbitrum One', symbol: 'ETH' },
  { chainId: 8453, name: 'Base Mainnet', symbol: 'ETH' },
  { chainId: 137, name: 'Polygon', symbol: 'MATIC' },
];

// CCTP (hanya testnet yang relevan)
export const CCTP_CONTRACTS = {
  sepolia: {
    USDC: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
    TokenMessenger: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa',
    DOMAIN: 0 ,
  },
  avalancheFuji: {
    MessageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275',
    DOMAIN: 1,
  },
};


export const RPC_URLS = {
  11155111: 'https://eth-sepolia.g.alchemy.com/v2/2n_F9mBFNv-uhG5HKIEdR',
  137: 'https://polygon-mainnet.g.alchemy.com/v2/2n_F9mBFNv-uhG5HKIEdR',
  42161: 'https://arb-mainnet.g.alchemy.com/v2/2n_F9mBFNv-uhG5HKIEdR',
  8453: 'https://base-mainnet.g.alchemy.com/v2/2n_F9mBFNv-uhG5HKIEdR',
  43113: 'https://avax-fuji.g.alchemy.com/v2/2n_F9mBFNv-uhG5HKIEdR',
};

