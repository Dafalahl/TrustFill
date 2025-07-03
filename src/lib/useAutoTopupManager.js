import { useEffect, useState, useRef } from 'react';
import { useAccount, useBalance, useWalletClient } from 'wagmi';
import { switchChain } from '@wagmi/core';
import { ethers } from 'ethers';
import { useLifiSwap } from '../lib/useLIFI';
import { TOKEN_LIST, TOKEN_ADDRESS } from '../lib/tokenmap';
import { cctpTransferFrontend } from './CCTP';
import { wagmiConfig } from '../lib/wagmiconfig';

// Define destination chains array for use in UI and logic
export const DESTINATION_CHAINS = [
  { chainId: 137, label: 'Polygon' },
  { chainId: 43113, label: 'Avalanche Fuji' },
];

const CHAIN_POLYGON = 137;
const CHAIN_AVALANCHE_FUJI = 43113;
const THRESHOLD = ethers.parseUnits('0.5', 6); // 0.5 USDC (BigInt) untuk ujicoba
const SAFETY = ethers.parseUnits('0', 6);    // 0 USDC tambahan (BigInt)
const INTERVAL_MS = 3 * 1000; // 3 detik untuk ujicoba

export function useAutoTopupManager() {
  const { address, isConnected } = useAccount();
  const { swap } = useLifiSwap();
  const { data: walletClient } = useWalletClient();
  const [isReady, setIsReady] = useState(false);
  const [autoActive, setAutoActive] = useState(false);
  const [log, setLog] = useState('Idle');
  const [countdown, setCountdown] = useState(INTERVAL_MS); // ms
  const [destinationChain, setDestinationChain] = useState(CHAIN_POLYGON);
  const [isRefilling, setIsRefilling] = useState(false);
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // Tambahkan state untuk pengaturan pengguna
  const [userCountdown, setUserCountdown] = useState(INTERVAL_MS);
  const [userThreshold, setUserThreshold] = useState(THRESHOLD);
  const [userSafety, setUserSafety] = useState(SAFETY);

  // Pantau saldo USDC di semua destination chain
  const polygonBalance = useBalance({
    address: isReady ? address : undefined,
    token: TOKEN_ADDRESS[CHAIN_POLYGON],
    chainId: CHAIN_POLYGON,
    watch: true,
  });
  const fujiBalance = useBalance({
    address: isReady ? address : undefined,
    token: TOKEN_ADDRESS[CHAIN_AVALANCHE_FUJI],
    chainId: CHAIN_AVALANCHE_FUJI,
    watch: true,
  });
  const balances = {
    [CHAIN_POLYGON]: polygonBalance.data,
    [CHAIN_AVALANCHE_FUJI]: fujiBalance.data,
  };
  // Pantau saldo USDC Sepolia secara real-time (pakai useBalance, bukan getBalance manual)
  const { data: sepoliaBalance } = useBalance({
    address: isReady ? address : undefined,
    token: TOKEN_ADDRESS[11155111],
    chainId: 11155111,
    watch: true,
  });
  useEffect(() => {
    if (sepoliaBalance && sepoliaBalance.value !== undefined) {
      // console.log('USDC Sepolia:', ethers.formatUnits(sepoliaBalance.value, 6));
    }
  }, [sepoliaBalance]);

  useEffect(() => {
    if (isConnected && typeof address === 'string' && address.length > 0) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [isConnected, address]);

  const getDestinationBalanceBN = () => {
    const bal = balances[destinationChain];
    return bal && bal.value !== undefined ? BigInt(bal.value) : 0n;
  };

  async function checkAndRefill(addr) {
    if (!isReady || !addr || isRefilling) return;
    setIsRefilling(true);
    try {
      const bal = getDestinationBalanceBN();
      if (bal < userThreshold) { // Gunakan userThreshold
        setIsWaitingApproval(true);
        // console.log(`[AutoTopup] Triggered: USDC ${destinationChain} < threshold, will attempt refill`);
      }
      setLog(`Current USDC: ${ethers.formatUnits(bal, 6)}`);
      if (bal >= userThreshold) return; // Gunakan userThreshold
      const needed = userThreshold + userSafety - bal; // Gunakan userThreshold dan userSafety
      setLog(`Need to top-up: ${ethers.formatUnits(needed, 6)} USDC`);
      // Cari token dengan saldo cukup via RPC lintas chain
      const currentChainId = walletClient?.chain?.id;
      const result = await findTokenWithSufficientBalanceRPC(addr, needed, currentChainId);
      if (!result) {
        setIsWaitingApproval(false);
        setLog('No source tokens found for refill (via RPC)');
        return;
      }
      setLog(`Found token ${result.token.symbol} on chain ${result.chainId} with balance ${ethers.formatUnits(result.balance, result.token.decimals)}`);
      // Pastikan user di chain yang benar
      if (walletClient && walletClient.chain && walletClient.chain.id !== result.chainId) {
        try {
          await switchChain(wagmiConfig, { chainId: result.chainId });
          setLog(`Switched to chain ${result.chainId} for refill.`);
        } catch (e) {
          setLog(`❌ Failed to switch chain: ${e.message}`);
          setIsWaitingApproval(false);
          return;
        }
      }
      const amountToTransfer = result.balance > needed ? needed : result.balance;
      // Logika pemilihan metode berdasarkan destination chain dan chain sumber
      if (result.chainId === 11155111 && destinationChain === CHAIN_AVALANCHE_FUJI) {
        // Gunakan CCTP hanya jika dari Sepolia ke Avalanche Fuji
        try {
          setLog(`Using CCTP to transfer ${ethers.formatUnits(amountToTransfer, 6)} USDC from Sepolia...`);
          await cctpTransferFrontend({
            walletClient,
            amount: amountToTransfer,
            destinationAddress: addr,
            onLog: setLog,
            destinationChain: CHAIN_AVALANCHE_FUJI,
          });
          setLog('✅ CCTP transfer successful!');
          if (fujiBalance && fujiBalance.refetch) {
            setLog('⏳ Refreshing Fuji balance...');
            await fujiBalance.refetch();
            setLog('✅ Fuji balance refreshed!');
          }
          setIsWaitingApproval(false);
          return;
        } catch (e) {
          setLog(`❌ CCTP failed: ${e.message}`);
        }
      }
      // Untuk semua kasus lain (termasuk Polygon destination atau chain sumber selain Sepolia), gunakan LIFI
      try {
        setLog(`Attempting LIFI swap from ${result.token.symbol} on chain ${result.chainId}...`);
        console.log(`[AutoTopup] Attempting LIFI swap from ${result.token.symbol} on chain ${result.chainId} to chain ${destinationChain}`);
        let sim;
        try {
          sim = await swap({
            fromChain: result.chainId,
            amountInWei: amountToTransfer.toString(),
            fromToken: result.token.address,
            simulate: true,
            toChain: destinationChain,
          });
        } catch (simError) {
          setLog(`LIFI simulation error: ${simError.message}`);
          console.error('[AutoTopup] LIFI simulation error:', simError);
          setIsWaitingApproval(false);
          return;
        }
        const expectedOut = BigInt(sim.steps[sim.steps.length - 1]?.toAmount || '0');
        if (expectedOut >= needed) {
          setLog(`Executing swap of ${ethers.formatUnits(amountToTransfer, result.token.decimals)} ${result.token.symbol}...`);
          console.log(`[AutoTopup] Executing swap of ${ethers.formatUnits(amountToTransfer, result.token.decimals)} ${result.token.symbol} from chain ${result.chainId} to chain ${destinationChain}`);
          try {
            await swap({
              fromChain: result.chainId,
              amountInWei: amountToTransfer.toString(),
              fromToken: result.token.address,
              toChain: destinationChain,
            });
            setLog(`✅ Successfully swapped to ${ethers.formatUnits(expectedOut, 6)} USDC`);
            console.log(`[AutoTopup] Successfully swapped to ${ethers.formatUnits(expectedOut, 6)} USDC`);
            setIsWaitingApproval(false);
            return;
          } catch (swapError) {
            setLog(`LIFI swap execution error: ${swapError.message}`);
            console.error('[AutoTopup] LIFI swap execution error:', swapError);
            setIsWaitingApproval(false);
            return;
          }
        } else {
          setLog(`Simulated output too low (${ethers.formatUnits(expectedOut, 6)} USDC)`);
          console.warn(`[AutoTopup] Simulated output too low: ${ethers.formatUnits(expectedOut, 6)} USDC`);
        }
      } catch (e) {
        setLog(`LIFI swap error: ${e.message}`);
        console.error('[AutoTopup] LIFI swap error:', e);
      }
      setLog('No available refill methods succeeded');
      setIsWaitingApproval(false);
    } finally {
      setIsRefilling(false);
    }
  }

  // Loop dinamis: cek saldo token di setiap chain satu per satu, switchChain, dan berhenti jika saldo cukup
  async function findTokenWithSufficientBalanceRPC(addr, needed, currentChainId) {
    const { RPC_URLS } = await import('./tokenmap');
    const chains = Object.keys(RPC_URLS).map(Number);

    // Prioritaskan chain saat ini, tapi JANGAN PERNAH gunakan chain tujuan
    const prioritizedChains = [
      currentChainId,
      ...chains.filter((id) => id !== currentChainId && id !== destinationChain),
    ].filter((id, idx, arr) => id !== destinationChain && arr.indexOf(id) === idx); // pastikan tidak ada duplikat dan tidak sama dengan tujuan

    for (const chainId of prioritizedChains) {
      if (chainId === destinationChain) continue; // skip jika chain sumber sama dengan tujuan
      const rpcUrl = RPC_URLS[chainId];
      if (!rpcUrl) continue;

      const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
      const tokens = TOKEN_LIST[chainId] || [];

      for (const token of tokens) {
        try {
          const abi = ['function balanceOf(address owner) view returns (uint256)'];
          const contract = new ethers.Contract(token.address, abi, provider);
          const bal = await contract.balanceOf(addr);

          if (bal && BigInt(bal) >= needed) {
            console.log(`[AutoTopup] Found sufficient balance: ${token.symbol} on chain ${chainId} = ${ethers.formatUnits(bal, token.decimals)}`);
            return {
              chainId,
              token,
              balance: BigInt(bal),
            };
          }
        } catch (err) {
          console.log(`[AutoTopup] Error checking ${token.symbol} on chain ${chainId}:`, err.message);
        }
      }
    }

    return null;
  }

  useEffect(() => {
    if (!isReady || !autoActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(userCountdown); // Gunakan userCountdown
      return;
    }
    setCountdown(userCountdown); // Gunakan userCountdown
    // Main interval for topup check
    intervalRef.current = setInterval(() => {
      const addr = address;
      const ready = isConnected && typeof addr === 'string' && addr.length > 0;
      if (!ready) return;
      checkAndRefill(addr);
      setCountdown(userCountdown); // Reset countdown dengan userCountdown
    }, userCountdown); // Gunakan userCountdown
    // Countdown interval (every second)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (isWaitingApproval) return prev;
        return prev > 1000 ? prev - 1000 : 0;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isReady, address, isConnected, autoActive, isWaitingApproval, userCountdown]); // Tambahkan userCountdown ke dependencies

  useEffect(() => {
    if (!isConnected) setAutoActive(false);
  }, [isConnected]);

  return {
    isConnected,
    address,
    isReady,
    autoActive,
    setAutoActive,
    log,
    destinationChain,
    setDestinationChain,
    destinationBalance: balances[destinationChain],
    checkAndRefill,
    countdown,
    isRefilling,
    isWaitingApproval,
    DESTINATION_CHAINS,
    userCountdown,
    setUserCountdown,
    userThreshold,
    setUserThreshold,
    userSafety,
    setUserSafety,
  };
}