import './lificonfig'; // Pastikan LIFI config sudah di-load sebelum swap apapun
import { getQuote, convertQuoteToRoute, executeRoute } from '@lifi/sdk';
import { useAccount } from 'wagmi';
import { getWalletClient } from '@wagmi/core';
import { wagmiConfig } from './wagmiconfig';
import { TOKEN_ADDRESS } from './tokenmap';

export function useLifiSwap(setLog) {
  const { address } = useAccount();

  // swap API lebih jelas, support toToken opsional
  const swap = async ({ fromChain, amountInWei, fromToken, toChain = 137, toToken }) => {
    const fromTokenAddr = fromToken || TOKEN_ADDRESS[fromChain];
    const toTokenAddr = toToken || TOKEN_ADDRESS[toChain];
    if (!fromTokenAddr || !toTokenAddr) throw new Error('Token address not found');
    try {
      // Ambil signer (WalletClient) dari wagmiConfig
      const signer = await getWalletClient(wagmiConfig);
      if (!signer) throw new Error('Wallet not connected');
      const quote = await getQuote({
        fromChain,
        toChain,
        fromToken: fromTokenAddr,
        toToken: toTokenAddr,
        fromAmount: amountInWei,
        fromAddress: address,
      });
      const route = convertQuoteToRoute(quote);
      const executedRoute = await executeRoute(route, {
        signer,
        updateRouteHook: (r) => {
          console.log('[LIFI] Route status updated:', r.status);
          setLog?.(`Swap status: ${r.status}`);
        },
      });
      return executedRoute;
    } catch (e) {
      setLog?.(`[LIFI] Error: ${e.message}`);
      console.error('[LIFI] Error:', e);
      throw e;
    }
  };

  return { swap };
}