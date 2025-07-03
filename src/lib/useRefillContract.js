import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import REFILL_ABI from './abi/RefillManagerABI.json';
const REFILL_CONTRACT = '0x98974023ce9e369515fe0d74a5ab26727aeb1f9c';

export function useRefillContract() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: 11155111 }); // Sepolia
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const fetchConfig = async () => {
    if (!address || !publicClient) return;
    try {
      const result = await publicClient.readContract({
        address: REFILL_CONTRACT,
        abi: REFILL_ABI,
        functionName: 'userConfigs',
        args: [address],
      });
      setConfig({
        threshold: result.threshold,
        receiver: result.targetChainReceiver,
        active: result.active,
      });
    } catch (err) {
      console.error('[fetchConfig] Error:', err);
    }
  };

  const saveConfig = async (thresholdUSDC, receiver) => {
    if (!walletClient || !address) return;
    setLoading(true);
    try {
      const threshold = parseUnits(thresholdUSDC, 6); // Convert to 6 decimals
      const hash = await walletClient.writeContract({
        address: REFILL_CONTRACT,
        abi: REFILL_ABI,
        functionName: 'setConfig',
        account: address,
        args: [threshold, receiver],
        chain: { id: 11155111 }, // Sepolia
      });
      setTxHash(hash);
    } catch (err) {
      console.error('[saveConfig] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerRefill = async (currentBalanceUSDC) => {
    if (!walletClient || !address) return;
    const balance = parseUnits(currentBalanceUSDC, 6);
    try {
      const hash = await walletClient.writeContract({
        address: REFILL_CONTRACT,
        abi: REFILL_ABI,
        functionName: 'triggerCheck',
        account: address,
        args: [address, balance],
        chain: { id: 11155111 },
      });
      console.log('[triggerRefill] hash:', hash);
    } catch (err) {
      console.error('[triggerRefill] Error:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [address]);

  return {
    config,
    loading,
    txHash,
    fetchConfig,
    saveConfig,
    triggerRefill,
  };
}
