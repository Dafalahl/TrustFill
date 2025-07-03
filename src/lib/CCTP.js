// Frontend CCTP transfer logic (MetaMask/wallet-based, not private key)
// Only for USDC Sepolia -> Avalanche Fuji
import { encodeFunctionData } from 'viem';
import { CCTP_CONTRACTS } from './tokenmap';
import { ethers } from 'ethers';

export async function cctpTransferFrontend({
  walletClient, // viem walletClient (from wagmi/useWalletClient)
  amount, // BigInt, 6 decimals
  destinationAddress,
  maxFee = 500n,
  minFinalityThreshold = 1000n,
  onLog = () => {},
}) {
  try {
    const logBoth = (msg) => {
      onLog(msg);
      if (typeof window !== 'undefined' && window.console) {
        console.log(msg);
      }
    };
    logBoth('[CCTP] Step 1: Approve USDC to TokenMessenger...');
    await walletClient.sendTransaction({
      to: CCTP_CONTRACTS.sepolia.USDC,
      data: encodeFunctionData({
        abi: [
          {
            type: 'function',
            name: 'approve',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'approve',
        args: [CCTP_CONTRACTS.sepolia.TokenMessenger, amount],
      }),
      chain: { id: 11155111 },
      account: walletClient.account,
    });
    logBoth('[CCTP] USDC approved.');

    // 2. depositForBurn
    logBoth('[CCTP] Step 2: Burning USDC (depositForBurn)...');
    const DESTINATION_ADDRESS_BYTES32 = `0x000000000000000000000000${destinationAddress.slice(2)}`;
    const DESTINATION_CALLER_BYTES32 = '0x' + '0'.repeat(64);
    const burnTxHash = await walletClient.sendTransaction({
      to: CCTP_CONTRACTS.sepolia.TokenMessenger,
      data: encodeFunctionData({
        abi: [
          {
            type: 'function',
            name: 'depositForBurn',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'amount', type: 'uint256' },
              { name: 'destinationDomain', type: 'uint32' },
              { name: 'mintRecipient', type: 'bytes32' },
              { name: 'burnToken', type: 'address' },
              { name: 'destinationCaller', type: 'bytes32' },
              { name: 'maxFee', type: 'uint256' },
              { name: 'minFinalityThreshold', type: 'uint32' },
            ],
            outputs: [],
          },
        ],
        functionName: 'depositForBurn',
        args: [
          amount,
          CCTP_CONTRACTS.avalancheFuji.DOMAIN,
          DESTINATION_ADDRESS_BYTES32,
          CCTP_CONTRACTS.sepolia.USDC,
          DESTINATION_CALLER_BYTES32,
          maxFee,
          minFinalityThreshold,
        ],
      }),
      chain: { id: 11155111 },
      account: walletClient.account,
    });
    logBoth(`[CCTP] Burn tx sent: ${burnTxHash}`);

    // 3. Ambil messageBytes dari event log burn
    logBoth('[CCTP] Step 3: Extracting messageBytes from burn tx...');
    const provider = new ethers.BrowserProvider(window.ethereum, 11155111);
    let receipt = null;
    let tries = 0;
    while (!receipt && tries < 20) { // max 20x percobaan (sekitar 20 detik)
      receipt = await provider.getTransactionReceipt(burnTxHash);
      if (!receipt) {
        logBoth(`[CCTP] Waiting for burn tx receipt... (try ${tries + 1})`);
        await new Promise((r) => setTimeout(r, 1000));
        tries++;
      }
    }
    if (!receipt) {
      logBoth('[CCTP] ❌ Error: Burn transaction receipt not found after waiting.');
      throw new Error('Burn transaction receipt not found after waiting');
    }
    if (!receipt.logs) {
      logBoth('[CCTP] ❌ Error: Burn transaction receipt has no logs.');
      throw new Error('Burn transaction receipt has no logs');
    }
    const iface = new ethers.Interface([
      'event MessageSent(bytes message)'
    ]);
    let messageBytes;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'MessageSent') {
          messageBytes = parsed.args[0];
          break;
        }
      } catch (e) {}
    }
    if (!messageBytes) throw new Error('MessageSent event not found in burn tx logs');
    logBoth('[CCTP] messageBytes extracted.');
    // 4. Hash messageBytes
    const messageHash = ethers.keccak256(messageBytes);
    logBoth(`[CCTP] messageHash: ${messageHash}`);

    // 5. Poll attestation by messageHash V2 API
        logBoth('[CCTP] Step 4: Polling attestation (API V2)...');

    let attestationResponse = { status: 'pending' };
    const maxAttestationTries = 60; // 2 minutes polling
    const API_URL = `https://iris-api-sandbox.circle.com/v2/messages/${CCTP_CONTRACTS.sepolia.DOMAIN}`;

    for (let tries = 1; tries <= maxAttestationTries; tries++) {
      try {
        const response = await fetch(`${API_URL}?transactionHash=${burnTxHash}`);
        const data = await response.json();

        if (data?.messages?.[0]?.status === 'complete') {
          attestationResponse = data.messages[0];
          logBoth('[CCTP] ✅ Attestation complete');
          break;
        }

        logBoth(`[CCTP] Attestation status: ${data?.messages?.[0]?.status || 'pending'} (attempt ${tries})`);
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        logBoth(`[CCTP] Attestation error: ${e.message}`);
      }
    }

    if (!attestationResponse.message || !attestationResponse.attestation) {
      throw new Error('[CCTP] ❌ Failed to retrieve valid attestation after polling.');
    }

    // ========== Step 5: Switch to Fuji and Mint ==========

    logBoth('[CCTP] Step 5: Minting USDC on Avalanche Fuji...');

    

    // 🔄 Switch to Fuji chain
    await walletClient.switchChain({ id: 43113 });

    // 🚀 Kirim tx mint ke MessageTransmitter di Fuji
    await walletClient.sendTransaction({
      to: CCTP_CONTRACTS.avalancheFuji.MessageTransmitter,
      data: encodeFunctionData({
        abi: [
          {
            type: 'function',
            name: 'receiveMessage',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'message', type: 'bytes' },
              { name: 'attestation', type: 'bytes' },
            ],
            outputs: [],
          },
        ],
        functionName: 'receiveMessage',
        args: [attestationResponse.message, attestationResponse.attestation],
      }),
      chain: { id: 43113 },
      account: walletClient.account,
    });

    logBoth('[CCTP] ✅ USDC minted on Avalanche Fuji!');
    
  } catch (err) {
    if (typeof window !== 'undefined' && window.console) {
      console.error('[CCTP] ❌ Error:', err);
    }
    onLog(`[CCTP] ❌ Error: ${err.message}`);
    throw err;
  }
}