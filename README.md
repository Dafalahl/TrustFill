# TrustFill - Automated USDC Balance Manager

🔗 **Live Demo:** [https://trust-fill.vercel.app](https://trust-fill.vercel.app)

---

## Overview

**TrustFill** is an **off-chain web-based application** that automates USDC balance top-ups across multiple blockchain networks when the balance falls below a specified threshold.  
Designed for DeFi users and crypto enthusiasts, TrustFill eliminates the need for manual balance monitoring and transactions.

---

## 🔑 Key Features

- 🚀 **Automatic USDC Top-ups** — Maintains optimal balance across chains  
- 🌐 **Multi-Chain Support** — Works with Ethereum Sepolia, Polygon, Arbitrum, Base, and Avalanche Fuji  
- ⚡ **Smart Routing** — Uses CCTP for Sepolia → Avalanche, and LIFI for all other cross-chain swaps  
- ⏱️ **Customizable Settings** — Adjust thresholds, safety buffers, and check intervals  
- 🔒 **Non-Custodial** — Your keys, your coins — we never hold your funds

---

## 🌎 Supported Networks

| Network           | Chain ID  | Type     |
|-------------------|-----------|----------|
| Ethereum Sepolia  | 11155111  | Testnet  |
| Avalanche Fuji    | 43113     | Testnet  |
| Polygon           | 137       | Mainnet  |
| Arbitrum One      | 42161     | Mainnet  |
| Base              | 8453      | Mainnet  |

---

## ⚙️ How It Works

1. **Monitor** — Continuously checks your USDC balance on selected chains  
2. **Detect** — Triggers when balance falls below your configured threshold  
3. **Route** — Smartly selects the best transfer method:
   - 🟢 **CCTP** for Sepolia → Avalanche transfers  
   - 🔁 **LIFI SDK** for all other cross-chain transfers  
4. **Execute** — Automatically completes the top-up transaction using your connected wallet

---

## 🚀 Getting Started

### Prerequisites

- Web3 wallet (e.g., MetaMask, Rainbow)
- USDC balance on supported source chains
- Testnet ETH (for Sepolia testnet operations)
- Need test tokens to try TrustFill on testnets? Use the following faucets:
   - 💵 **USDC Testnet (Circle Faucet):**  
     https://faucet.circle.com

   - 🛠️ **Ethereum Sepolia Faucet:**  
     https://cloud.google.com/application/web3/faucet/ethereum/sepolia

   - ❄️ **Avalanche Fuji Faucet:**  
     https://core.app/tools/testnet-faucet/?subnet=c&token=c

### Installation

No installation required!  
Just open [https://trust-fill.vercel.app](https://trust-fill.vercel.app) and connect your wallet.

---

## 🛠️ Configuration Options

- Set your **minimum USDC threshold**  
- Configure **safety buffer** amount  
- Adjust **check interval** (seconds to hours)  
- Select your **target destination chain**

---

## 🔐 Security

TrustFill is built with a **non-custodial architecture**:
- ✅ Transactions are signed by your wallet
- ❌ No private keys are ever accessed
- 🧠 Smart contracts (when applicable) are open source and auditable

---

## 🧪 Development

### 🧰 Tech Stack

- **Frontend:** React, Vite  
- **Blockchain Integration:** Wagmi, Viem, Ethers.js  
- **Cross-Chain Infrastructure:** LIFI SDK, Circle CCTP  
- **UI & Wallets:** RainbowKit, Tailwind CSS

---

## 📬 Contact

For questions, issues, or contributions, please open an issue or contact the team.

---

> TrustFill — Automated liquidity. Cross-chain. Off-chain. Effortless.
