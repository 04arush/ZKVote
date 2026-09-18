import { useState, useCallback, useEffect } from "react";
import { BrowserProvider } from "ethers";

const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);
const EXPECTED_CHAIN_HEX = "0x" + EXPECTED_CHAIN_ID.toString(16);

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  const refreshSigner = useCallback(async (browserProvider) => {
    const network = await browserProvider.getNetwork();
    const currentChainId = Number(network.chainId);
    setChainId(currentChainId);
    setWrongNetwork(currentChainId !== EXPECTED_CHAIN_ID);

    const signerObj = await browserProvider.getSigner();
    const addr = await signerObj.getAddress();
    setSigner(signerObj);
    setAddress(addr);
  }, []);

  const ensureCorrectNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: EXPECTED_CHAIN_HEX }],
      });
    } catch (err) {
      console.error("Network switch failed or was rejected:", err);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install the MetaMask extension.");
      return;
    }
    const browserProvider = new BrowserProvider(window.ethereum);
    await browserProvider.send("eth_requestAccounts", []);
    setProvider(browserProvider);
    await refreshSigner(browserProvider);
  }, [refreshSigner]);

  const switchAccount = useCallback(async () => {
    if (!window.ethereum) return;
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
    await connect();
  }, [connect]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAddress(null); setSigner(null); setProvider(null); setChainId(null);
        return;
      }
      if (provider) await refreshSigner(provider);
    };
    const handleChainChanged = () => {
      window.location.reload();
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, refreshSigner]);

  return { address, signer, provider, chainId, wrongNetwork, connect, switchAccount, ensureCorrectNetwork };
}
