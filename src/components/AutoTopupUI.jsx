import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import "../App.css";

// Konversi nilai waktu ke milidetik
const timeToMs = (value, unit) => {
  switch (unit) {
    case 'seconds': return value * 1000;
    case 'minutes': return value * 60 * 1000;
    case 'hours': return value * 60 * 60 * 1000;
    default: return value * 1000;
  }
};
// Format countdown (HH:MM:SS)
const formatCountdown = (ms) => {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function AutoTopupUI({
  isConnected,
  autoActive,
  setAutoActive,
  destinationChain,
  setDestinationChain,
  destinationBalance,
  countdown,
  DESTINATION_CHAINS,
  userCountdown,
  setUserCountdown,
  userThreshold,
  setUserThreshold,
  userSafety,
  setUserSafety,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [timeValue, setTimeValue] = useState(10);
  const [timeUnit, setTimeUnit] = useState('seconds');
  const [isInitialized, setIsInitialized] = useState(false);
  const [localThreshold, setLocalThreshold] = useState(userThreshold);
  const [localSafety, setLocalSafety] = useState(userSafety);

  useEffect(() => {
    if (!isInitialized && userCountdown) {
      if (userCountdown % 3600000 === 0) {
        setTimeValue(userCountdown / 3600000);
        setTimeUnit('hours');
      } else if (userCountdown % 60000 === 0) {
        setTimeValue(userCountdown / 60000);
        setTimeUnit('minutes');
      } else {
        setTimeValue(userCountdown / 1000);
        setTimeUnit('seconds');
      }
      setIsInitialized(true);
    }
  }, [userCountdown, isInitialized]);

  useEffect(() => {
    setLocalThreshold(userThreshold);
    setLocalSafety(userSafety);
  }, [userThreshold, userSafety, showSettings]);

  const handleSaveSettings = () => {
    const ms = timeToMs(timeValue, timeUnit);
    setUserCountdown(ms);
    setUserThreshold(localThreshold);
    setUserSafety(localSafety);
    setShowSettings(false);
  };

  const formatUSDC = (val) => (val ? Number(ethers.formatUnits(val, 6)).toFixed(2) : "0.00");
  const parseUSDC = (val) => {
    const num = Number(val);
    if (isNaN(num) || num < 0) return 0n;
    return ethers.parseUnits(num.toFixed(6), 6);
  };

  return (
    <div className="ui-container">
      <div className="ui-card">
        <div className="ui-header">
          <div className="header-content">
            <h1 className="dapp-title">TrustFill</h1>
            <div className="header-actions">
              <ConnectButton 
                showBalance={false}
                accountStatus="avatar"
                chainStatus="icon"
              />
              <button 
                className="settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Settings"
              >
                <SettingsIcon />
              </button>
            </div>
          </div>
          <p className="dapp-description">Auto top-up your wallet when balance is low</p>
        </div>

        {showSettings ? (
          <div className="settings-panel">
            <h3 className="settings-title">Settings</h3>
            
            <div className="setting-group">
              <label className="setting-label">Check Interval</label>
              <div className="interval-control">
                <input
                  type="number"
                  min="1"
                  value={timeValue}
                  onChange={(e) => setTimeValue(Math.max(1, Number(e.target.value)))}
                  className="interval-input"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value)}
                  className="interval-select"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">Minimum USDC Threshold</label>
              <div className="usdc-input-container">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formatUSDC(localThreshold)}
                  onChange={(e) => setLocalThreshold(parseUSDC(e.target.value))}
                  className="usdc-input"
                />
                <span className="usdc-suffix">USDC</span>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">Safety Buffer</label>
              <div className="usdc-input-container">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formatUSDC(localSafety)}
                  onChange={(e) => setLocalSafety(parseUSDC(e.target.value))}
                  className="usdc-input"
                />
                <span className="usdc-suffix">USDC</span>
              </div>
            </div>

            <div className="settings-actions">
              <button 
                className="secondary-btn"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-btn"
                onClick={handleSaveSettings}
              >
                Save Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="main-content">
            <div className="balance-card">
              <div className="balance-header">
                <span className="balance-label">Current Balance</span>
                <span className="balance-value">
                  {destinationBalance ? destinationBalance.formatted : "0.00"} USDC
                </span>
              </div>
              <div className="balance-progress">
                {(() => {
                  const bal = Number(destinationBalance?.value ?? 0n);
                  const threshold = Number(userThreshold ?? 1n);
                  const percent = Math.min(100, threshold > 0 ? (bal / threshold) * 100 : 0);
                  return (
                    <div
                      className="progress-bar"
                      style={{ width: `${percent}%` }}
                    ></div>
                  );
                })()}
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Destination Chain</span>
                <select
                  value={destinationChain}
                  onChange={(e) => setDestinationChain(Number(e.target.value))}
                  className="chain-select"
                >
                  {DESTINATION_CHAINS.map((opt) => (
                    <option key={opt.chainId} value={opt.chainId}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="info-item">
                <span className="info-label">Status</span>
                <div className={`status-badge ${isConnected && autoActive ? "active" : "inactive"}`}>
                  {isConnected && autoActive ? "ACTIVE" : "INACTIVE"}
                </div>
              </div>

              <div className="info-item">
                <span className="info-label">Next Check</span>
                <div className="countdown">
                  {formatCountdown(countdown)}
                </div>
              </div>
            </div>

            <button
              className={`action-btn ${autoActive ? "active" : ""}`}
              onClick={() => setAutoActive(!autoActive)}
              disabled={!isConnected}
            >
              {autoActive ? "Stop Auto Top-up" : "Start Auto Top-up"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15C19.2669 15.3016 19.227 15.6362 19.2857 15.9606C19.3443 16.285 19.4989 16.5834 19.726 16.81L19.81 16.894C19.9216 17.0055 20.0112 17.1379 20.0736 17.2838C20.1361 17.4297 20.1701 17.5864 20.1736 17.745C20.1771 17.9036 20.1501 18.0614 20.0941 18.2099C20.0381 18.3584 19.9543 18.4946 19.847 18.61L18.577 19.88C18.4614 19.9873 18.3252 20.0711 18.1767 20.1271C18.0282 20.1831 17.8704 20.2101 17.7118 20.2066C17.5532 20.2031 17.3965 20.1691 17.2506 20.1066C17.1047 20.0442 16.9723 19.9546 16.86 19.843L16.776 19.759C16.5494 19.5319 16.251 19.3773 15.9266 19.3187C15.6022 19.26 15.2676 19.2999 14.966 19.433C14.6644 19.5661 14.4116 19.7854 14.241 20.06L13.251 21.5C13.0804 21.7746 12.8998 21.8873 12.71 21.9H11.29C11.1002 21.8873 10.9196 21.7746 10.749 21.5L9.759 20.06C9.58842 19.7854 9.33558 19.5661 9.034 19.433C8.73242 19.2999 8.3978 19.26 8.0734 19.3187C7.74901 19.3773 7.45057 19.5319 7.224 19.759L7.14 19.843C7.0277 19.9546 6.8953 20.0442 6.7494 20.1066C6.6035 20.1691 6.4468 20.2031 6.2882 20.2066C6.1296 20.2101 5.9718 20.1831 5.8233 20.1271C5.6748 20.0711 5.5386 19.9873 5.423 19.88L4.153 18.61C4.0457 18.4946 3.9619 18.3584 3.9059 18.2099C3.8499 18.0614 3.8229 17.9036 3.8264 17.745C3.8299 17.5864 3.8639 17.4297 3.9264 17.2838C3.9888 17.1379 4.0784 17.0055 4.19 16.894L4.274 16.81C4.5011 16.5834 4.6557 16.285 4.7143 15.9606C4.773 15.6362 4.7331 15.3016 4.6 15C4.4669 14.6984 4.227 14.3638 3.914 14.1H3C2.44772 14.1 2 13.6523 2 13.1V10.9C2 10.3477 2.44772 9.9 3 9.9H3.914C4.227 9.6362 4.4669 9.3016 4.6 9C4.7331 8.6984 4.773 8.3638 4.7143 8.0394C4.6557 7.715 4.5011 7.4166 4.274 7.19L4.19 7.106C4.0784 6.9945 3.9888 6.8621 3.9264 6.7162C3.8639 6.5703 3.8299 6.4136 3.8264 6.255C3.8229 6.0964 3.8499 5.9386 3.9059 5.7901C3.9619 5.6416 4.0457 5.5054 4.153 5.39L5.423 4.12C5.5386 4.0127 5.6748 3.9289 5.8233 3.8729C5.9718 3.8169 6.1296 3.7899 6.2882 3.7934C6.4468 3.7969 6.6035 3.8309 6.7494 3.8934C6.8953 3.9558 7.0277 4.0454 7.14 4.157L7.224 4.241C7.45057 4.4681 7.74901 4.6227 8.0734 4.6813C8.3978 4.74 8.73242 4.7001 9.034 4.567C9.33558 4.4339 9.58842 4.2146 9.759 3.94L10.749 2.5C10.9196 2.2254 11.1002 2.1127 11.29 2.1H12.71C12.8998 2.1127 13.0804 2.2254 13.251 2.5L14.241 3.94C14.4116 4.2146 14.6644 4.4339 14.966 4.567C15.2676 4.7001 15.6022 4.74 15.9266 4.6813C16.251 4.6227 16.5494 4.4681 16.776 4.241L16.86 4.157C16.9723 4.0454 17.1047 3.9558 17.2506 3.8934C17.3965 3.8309 17.5532 3.7969 17.7118 3.7934C17.8704 3.7899 18.0282 3.8169 18.1767 3.8729C18.3252 3.9289 18.4614 4.0127 18.577 4.12L19.847 5.39C19.9543 5.5054 20.0381 5.6416 20.0941 5.7901C20.1501 5.9386 20.1771 6.0964 20.1736 6.255C20.1701 6.4136 20.1361 6.5703 20.0736 6.7162C20.0112 6.8621 19.9216 6.9945 19.81 7.106L19.726 7.19C19.4989 7.4166 19.3443 7.715 19.2857 8.0394C19.227 8.3638 19.2669 8.6984 19.4 9C19.5331 9.3016 19.773 9.6362 20.086 9.9H21C21.5523 9.9 22 10.3477 22 10.9V13.1C22 13.6523 21.5523 14.1 21 14.1H20.086C19.773 14.3638 19.5331 14.6984 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
