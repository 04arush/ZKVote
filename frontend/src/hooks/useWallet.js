import { useState, useCallback } from "react";
import { BrowserProvider } from "ethers";

export function useWallet() {
    const [address, setAddress] = useState(null);
    const [signer, setSigner] = useState(null);
    const [provider, setProvider] = useState(null);

    const connect = useCallback(async () => {
        if (!window.ethereum) {
            alert("MetaMask not detected. Please install the MetaMask extension.");
            return;
        }
        const browserProvider = new BrowserProvider(window.ethereum);
        await browserProvider.send("eth_requestAccounts", []);
        const signerObj = await browserProvider.getSigner();
        const addr = await signerObj.getAddress();

        setProvider(browserProvider);
        setSigner(signerObj);
        setAddress(addr);
    }, []);

    return { address, signer, provider, connect };
}
