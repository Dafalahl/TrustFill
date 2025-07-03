// Penting: createConfig hanya boleh dipanggil sekali di root app/provider, sebelum operasi swap apapun!
import { RPC_URLS } from './tokenmap';
import { createConfig, EVM, config, getChains, ChainType } from '@lifi/sdk';
import { getWalletClient, switchChain } from '@wagmi/core';
import { wagmiConfig } from './wagmiconfig';

createConfig({
    integrator: 'TrustFill',
    preloadChains: true,
    rpcUrls: RPC_URLS,
    providers:[
        EVM({
            getWalletClient: async () => {
                try {
                    const client = await getWalletClient(wagmiConfig);
                    if (!client) throw new Error('Wallet client not available. Pastikan wallet sudah connect.');
                    return client;
                } catch (err) {
                    console.warn('getWalletClient error:', err);
                    throw err;
                }
            },
            switchChain: async ({chainId}) => {
                try {
                    const switched = await switchChain(wagmiConfig, {chainId});
                    if (!switched || !switched.chain) throw new Error('Switch chain gagal atau chain tidak ditemukan.');
                    const client = await getWalletClient(wagmiConfig, {chainId: switched.chain.id});
                    if (!client) throw new Error('Wallet client not available setelah switch chain.');
                    return client;
                } catch (err) {
                    console.warn('switchChain error:', err);
                    throw err;
                }
            },
            getSigner: async () => {
                try {
                    const client = await getWalletClient(wagmiConfig);
                    if (!client) throw new Error('Signer tidak tersedia. Pastikan wallet sudah connect.');
                    // Debug: pastikan client punya method signTransaction/sendTransaction
                    if (typeof client?.signTransaction !== 'function' && typeof client?.sendTransaction !== 'function') {
                        console.warn('Signer (WalletClient) tidak punya method signTransaction/sendTransaction.');
                    }
                    return client;
                } catch (err) {
                    console.warn('getSigner error:', err);
                    throw err;
                }
            }
        })
    ]
});

// Debug: log chains dan rpcUrls setelah chains di-set
// (async () => {
//   const chains = await getChains({ chainTypes: [ChainType.EVM] });
//   config.setChains(chains);
//   console.log('Chains configured:', config.getChains());
//   console.log('RPC URLs:', await config.getRPCUrls());
// })();

