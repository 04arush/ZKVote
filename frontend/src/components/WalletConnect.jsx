import React, { useState, useEffect } from 'react';
import { getProvider } from '../utils/contract';
import { SEPOLIA_CHAIN_ID } from '../constants/addresses';
import ErrorScreen from './ErrorScreen';

const WalletConnect = ({ onConnect }) => {
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to use this app.');
      }

      const provider = getProvider();
      await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        throw new Error('Please switch to Sepolia testnet');
      }

      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      
      setAddress(addr);
      onConnect(signer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
      <h2>Wallet Connection</h2>
      <ErrorScreen error={error} />
      
      {!address ? (
        <button 
          onClick={connectWallet} 
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          {loading ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      ) : (
        <div style={{ color: '#0a0' }}>
          <strong>Connected:</strong> {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
